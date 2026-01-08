-- ===========================================
-- Templates Table (Global - not tenant-specific)
-- Pre-built conversation scripts users can start from
-- ===========================================

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT DEFAULT 'bot',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Stats (can be updated periodically)
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  active_users INTEGER DEFAULT 0,

  -- Agent configuration to copy
  personality TEXT,
  goal TEXT,
  script_steps JSONB DEFAULT '[]'::jsonb,
  faq_entries JSONB DEFAULT '[]'::jsonb,
  escalation_keywords TEXT[] DEFAULT ARRAY['human', 'person', 'manager', 'complaint'],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_featured ON templates(is_featured) WHERE is_featured = true;

-- No RLS on templates - they're global and public readable
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Everyone can read templates
CREATE POLICY "Templates are publicly readable" ON templates
  FOR SELECT USING (true);

-- Only service role can modify templates
CREATE POLICY "Only service role can modify templates" ON templates
  FOR ALL USING (auth.role() = 'service_role');

-- ===========================================
-- Message Queue Table (for escalated & outside hours)
-- ===========================================

CREATE TABLE IF NOT EXISTS message_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,

  queue_type TEXT NOT NULL CHECK (queue_type IN ('escalated', 'outside_hours')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  priority INTEGER DEFAULT 0,

  -- The message that triggered the queue entry
  original_message TEXT NOT NULL,
  reason TEXT,  -- Why it was queued (e.g., "Price question detected")
  suggested_response TEXT,  -- AI suggested response

  -- Resolution
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_message TEXT,  -- What was sent to resolve

  scheduled_for TIMESTAMPTZ,  -- For outside hours - when to send
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_message_queue_tenant ON message_queue(tenant_id);
CREATE INDEX IF NOT EXISTS idx_message_queue_status ON message_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_message_queue_type ON message_queue(queue_type);

-- RLS
ALTER TABLE message_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view queue in their tenants" ON message_queue
  FOR SELECT USING (auth.user_has_tenant_access(tenant_id));

CREATE POLICY "Users can manage queue in their tenants" ON message_queue
  FOR ALL USING (auth.user_has_tenant_access(tenant_id));

-- ===========================================
-- Seed Templates Data
-- ===========================================

INSERT INTO templates (name, description, category, icon, is_featured, conversion_rate, active_users, personality, goal, script_steps, faq_entries, escalation_keywords)
VALUES
(
  'Real Estate Lead Qualifier',
  'Automatically qualify leads, schedule property viewings, and follow up with potential buyers.',
  'Real Estate',
  'home',
  true,
  94.0,
  1200,
  'Professional, knowledgeable about real estate, helpful and patient. Speaks clearly and avoids jargon.',
  'Qualify leads by understanding their property needs, budget, and timeline. Schedule property viewings for qualified leads.',
  '[
    {"step": 1, "goal": "Greeting and introduction", "message_template": "Hi {{name}}! Thanks for your interest in our properties. I''m here to help you find your perfect home. What type of property are you looking for?", "wait_for_response": true},
    {"step": 2, "goal": "Understand requirements", "message_template": "Great choice! And what''s your ideal location or neighborhood?", "wait_for_response": true},
    {"step": 3, "goal": "Budget qualification", "message_template": "Perfect. To show you the most relevant options, could you share your approximate budget range?", "wait_for_response": true},
    {"step": 4, "goal": "Timeline", "message_template": "That helps a lot! When are you looking to move? Are you pre-approved for a mortgage?", "wait_for_response": true},
    {"step": 5, "goal": "Schedule viewing", "message_template": "Excellent! I have some great properties that match your criteria. Would you like to schedule a viewing this week? I have availability on {{available_days}}.", "wait_for_response": true}
  ]'::jsonb,
  '[
    {"question": "What areas do you cover?", "answer": "We cover the entire metropolitan area including downtown, suburbs, and surrounding communities."},
    {"question": "What are the fees?", "answer": "Our buyer services are completely free - the seller pays all commission fees."},
    {"question": "How long does the process take?", "answer": "Typically 30-60 days from accepted offer to closing, depending on financing and inspections."}
  ]'::jsonb,
  ARRAY['human', 'agent', 'person', 'manager', 'complaint', 'lawyer', 'legal']
),
(
  'Medical Practice',
  'Book appointments and handle patient inquiries with empathy and professionalism.',
  'Healthcare',
  'heart',
  false,
  89.0,
  856,
  'Warm, empathetic, and professional. Prioritizes patient comfort and confidentiality. Never gives medical advice.',
  'Help patients schedule appointments, answer general practice questions, and provide office information.',
  '[
    {"step": 1, "goal": "Greeting", "message_template": "Hello {{name}}! Thank you for contacting our practice. How can I assist you today?", "wait_for_response": true},
    {"step": 2, "goal": "Understand need", "message_template": "I understand. Are you an existing patient or would you like to register as a new patient?", "wait_for_response": true},
    {"step": 3, "goal": "Appointment type", "message_template": "What type of appointment would you like to schedule? We offer general consultations, follow-ups, and preventive check-ups.", "wait_for_response": true},
    {"step": 4, "goal": "Schedule", "message_template": "I can offer you an appointment on {{available_slots}}. Which time works best for you?", "wait_for_response": true},
    {"step": 5, "goal": "Confirm", "message_template": "Perfect! I''ve scheduled your appointment for {{date}} at {{time}}. You''ll receive a confirmation email shortly. Is there anything else I can help with?", "wait_for_response": true}
  ]'::jsonb,
  '[
    {"question": "What are your opening hours?", "answer": "We''re open Monday to Friday 8am-6pm and Saturdays 9am-1pm."},
    {"question": "Do you accept insurance?", "answer": "Yes, we accept most major insurance plans. Please bring your insurance card to your appointment."},
    {"question": "How do I get my test results?", "answer": "Test results are typically available within 3-5 business days. You''ll be contacted by our team, or you can check through our patient portal."}
  ]'::jsonb,
  ARRAY['human', 'doctor', 'emergency', 'urgent', 'pain', 'bleeding']
),
(
  'E-commerce Store',
  'Product recommendations, order support, and customer service automation.',
  'E-commerce',
  'shopping-cart',
  false,
  76.0,
  2340,
  'Friendly, helpful, and enthusiastic about products. Quick to resolve issues and find solutions.',
  'Assist customers with product questions, order status, and purchase decisions. Resolve basic support issues.',
  '[
    {"step": 1, "goal": "Welcome", "message_template": "Hey {{name}}! Welcome to our store. How can I help you today?", "wait_for_response": true},
    {"step": 2, "goal": "Understand need", "message_template": "Are you looking for something specific, or would you like some recommendations?", "wait_for_response": true},
    {"step": 3, "goal": "Product info", "message_template": "Great choice! That''s one of our best sellers. Would you like to know more about sizing, colors, or shipping?", "wait_for_response": true},
    {"step": 4, "goal": "Convert", "message_template": "I can offer you free shipping on orders over $50! Ready to add this to your cart?", "wait_for_response": true}
  ]'::jsonb,
  '[
    {"question": "What is your return policy?", "answer": "We offer 30-day hassle-free returns on all items. Items must be unworn with tags attached."},
    {"question": "How long does shipping take?", "answer": "Standard shipping is 3-5 business days. Express shipping (1-2 days) is available at checkout."},
    {"question": "Do you ship internationally?", "answer": "Yes! We ship to over 50 countries. International shipping typically takes 7-14 business days."}
  ]'::jsonb,
  ARRAY['human', 'manager', 'refund', 'complaint', 'damaged', 'broken']
),
(
  'Business Consulting',
  'Qualify leads, book discovery calls, and provide initial consultation.',
  'B2B',
  'briefcase',
  false,
  82.0,
  534,
  'Professional, knowledgeable, and results-oriented. Focuses on understanding business challenges and demonstrating value.',
  'Qualify potential clients by understanding their business challenges and schedule discovery calls with consultants.',
  '[
    {"step": 1, "goal": "Introduction", "message_template": "Hi {{name}}, thanks for reaching out! I''d love to learn more about your business. What industry are you in?", "wait_for_response": true},
    {"step": 2, "goal": "Pain points", "message_template": "Interesting! What''s the biggest challenge your business is facing right now?", "wait_for_response": true},
    {"step": 3, "goal": "Goals", "message_template": "I see. And what would success look like for you in the next 6-12 months?", "wait_for_response": true},
    {"step": 4, "goal": "Qualify", "message_template": "That sounds like something we can definitely help with. What''s your current team size and approximate revenue range?", "wait_for_response": true},
    {"step": 5, "goal": "Book call", "message_template": "Perfect. I''d love to set up a 30-minute discovery call with one of our senior consultants. Are you available {{available_times}}?", "wait_for_response": true}
  ]'::jsonb,
  '[
    {"question": "What services do you offer?", "answer": "We offer strategy consulting, operational optimization, digital transformation, and executive coaching."},
    {"question": "How much do you charge?", "answer": "Our pricing varies based on project scope. We can discuss specifics during our discovery call."},
    {"question": "Who are your typical clients?", "answer": "We work with mid-size to enterprise companies across technology, finance, healthcare, and manufacturing sectors."}
  ]'::jsonb,
  ARRAY['human', 'manager', 'boss', 'price', 'cost', 'budget']
),
(
  'Online Course',
  'Answer student questions, promote courses, and handle enrollments.',
  'Education',
  'graduation-cap',
  false,
  71.0,
  423,
  'Encouraging, knowledgeable, and supportive. Makes learning feel accessible and exciting.',
  'Help prospective students understand course offerings and guide them to enrollment.',
  '[
    {"step": 1, "goal": "Welcome", "message_template": "Hi {{name}}! Welcome to our learning platform. What subject are you interested in learning?", "wait_for_response": true},
    {"step": 2, "goal": "Experience level", "message_template": "Great topic! What''s your current experience level? Are you a complete beginner or do you have some background?", "wait_for_response": true},
    {"step": 3, "goal": "Goals", "message_template": "What''s your main goal? Are you learning for career advancement, a specific project, or personal interest?", "wait_for_response": true},
    {"step": 4, "goal": "Recommend", "message_template": "Based on what you''ve shared, I think our {{course_name}} would be perfect for you. It includes {{features}}. Would you like more details?", "wait_for_response": true},
    {"step": 5, "goal": "Enroll", "message_template": "We''re currently offering a special discount! Ready to start your learning journey?", "wait_for_response": true}
  ]'::jsonb,
  '[
    {"question": "Do I get a certificate?", "answer": "Yes! You''ll receive a certificate of completion that you can share on LinkedIn and add to your resume."},
    {"question": "Is there a money-back guarantee?", "answer": "Absolutely! We offer a 30-day money-back guarantee if you''re not satisfied."},
    {"question": "How long do I have access?", "answer": "You get lifetime access to the course content, including any future updates."}
  ]'::jsonb,
  ARRAY['human', 'instructor', 'teacher', 'refund', 'complaint']
),
(
  'Car Dealership',
  'Schedule test drives, answer vehicle questions, and follow up on leads.',
  'Automotive',
  'car',
  false,
  85.0,
  678,
  'Friendly, knowledgeable about vehicles, and helpful without being pushy. Focuses on finding the right fit.',
  'Help potential buyers find the right vehicle, answer questions, and schedule test drives.',
  '[
    {"step": 1, "goal": "Welcome", "message_template": "Hi {{name}}! Thanks for your interest in our vehicles. Are you looking for a new or pre-owned car?", "wait_for_response": true},
    {"step": 2, "goal": "Vehicle type", "message_template": "What type of vehicle are you interested in? Sedan, SUV, truck, or something else?", "wait_for_response": true},
    {"step": 3, "goal": "Requirements", "message_template": "What features are most important to you? (e.g., fuel efficiency, space, technology, towing capacity)", "wait_for_response": true},
    {"step": 4, "goal": "Budget", "message_template": "Do you have a budget in mind? And will you be financing or paying cash?", "wait_for_response": true},
    {"step": 5, "goal": "Test drive", "message_template": "I have some great options that match your criteria! Would you like to come in for a test drive? We''re open {{hours}}.", "wait_for_response": true}
  ]'::jsonb,
  '[
    {"question": "Do you offer financing?", "answer": "Yes! We work with multiple lenders to find you the best rates. We can pre-approve you in minutes."},
    {"question": "What warranty do you offer?", "answer": "New vehicles come with manufacturer warranty. Pre-owned vehicles include our dealership warranty plus optional extended coverage."},
    {"question": "Do you accept trade-ins?", "answer": "Absolutely! We offer competitive trade-in values. Bring your vehicle in for a free appraisal."}
  ]'::jsonb,
  ARRAY['human', 'manager', 'salesperson', 'complaint', 'lemon', 'problem']
)
ON CONFLICT DO NOTHING;

-- Trigger for updated_at on templates
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
