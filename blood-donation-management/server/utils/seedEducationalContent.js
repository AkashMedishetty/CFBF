const EducationalContent = require('../models/EducationalContent');
const FAQ = require('../models/FAQ');
const logger = require('./logger');

const sampleContent = [
  {
    title: "Complete Guide to Blood Donation Preparation",
    slug: "complete-guide-to-blood-donation-preparation",
    type: "guide",
    category: "preparation",
    content: `
# Complete Guide to Blood Donation Preparation

Blood donation is a noble act that can save lives. Proper preparation ensures a safe and comfortable donation experience for both you and the recipient.

## Before Your Donation

### 24-48 Hours Before
- Get adequate sleep (7-8 hours)
- Stay well-hydrated by drinking plenty of water
- Eat iron-rich foods like spinach, red meat, or beans
- Avoid alcohol consumption

### Day of Donation
- Eat a healthy, iron-rich meal 3-4 hours before donation
- Drink 16-20 ounces of water before arriving
- Wear comfortable clothing with sleeves that can be rolled up
- Bring a valid ID and donor card if you have one

## What to Expect

### Registration Process
1. Complete health questionnaire
2. Mini-physical examination (temperature, blood pressure, pulse)
3. Hemoglobin test
4. Review of medical history

### Donation Process
1. Comfortable seating in donation chair
2. Arm cleaning and needle insertion
3. 8-10 minutes of actual donation
4. Post-donation monitoring

## After Donation Care

### Immediate Care (First 24 Hours)
- Keep bandage on for 4-6 hours
- Avoid heavy lifting with donation arm
- Drink extra fluids
- Eat iron-rich foods

### Recovery Tips
- Rest if feeling lightheaded
- Avoid strenuous exercise for 24 hours
- Monitor donation site for any unusual symptoms
- Contact medical staff if concerns arise

## Common Concerns Addressed

**Will it hurt?** Most donors experience only a brief pinch during needle insertion.

**How long does it take?** The entire process takes about 45-60 minutes, with actual donation taking 8-10 minutes.

**Is it safe?** Yes, all equipment is sterile and used only once. There's no risk of infection.

Remember, your donation can save up to three lives. Thank you for your generosity!
    `,
    excerpt: "A comprehensive guide covering everything you need to know about preparing for blood donation, from pre-donation care to post-donation recovery.",
    author: {
      name: "Dr. Sarah Johnson",
      title: "Hematologist",
      credentials: "MD, PhD in Hematology"
    },
    tags: ["preparation", "safety", "health", "donation process"],
    readingTime: 8,
    difficulty: "beginner",
    isPublished: true,
    isFeatured: true,
    publishedAt: new Date('2024-01-15')
  },
  {
    title: "Nutrition Tips for Blood Donors",
    slug: "nutrition-tips-for-blood-donors",
    type: "article",
    category: "nutrition",
    content: `
# Nutrition Tips for Blood Donors

Proper nutrition plays a crucial role in maintaining healthy blood levels and ensuring successful donations.

## Iron-Rich Foods

### Best Sources
- **Red meat**: Beef, lamb (3-4mg iron per serving)
- **Poultry**: Chicken, turkey (1-2mg iron per serving)
- **Fish**: Salmon, tuna, sardines (1-3mg iron per serving)
- **Plant sources**: Spinach, lentils, tofu (2-6mg iron per serving)

### Enhancing Iron Absorption
- Combine with Vitamin C sources (citrus fruits, tomatoes, bell peppers)
- Cook in cast iron cookware
- Avoid tea and coffee with iron-rich meals

## Hydration Guidelines

### Daily Requirements
- **Men**: 15.5 cups (3.7 liters) of fluids daily
- **Women**: 11.5 cups (2.7 liters) of fluids daily
- **Pre-donation**: Extra 16-20 oz of water

### Best Hydration Sources
- Water (primary choice)
- Natural fruit juices
- Herbal teas
- Milk and dairy products

## Foods to Avoid

### Before Donation
- Fatty or greasy foods (can affect blood tests)
- Excessive caffeine
- Alcohol (24 hours before)
- High-sodium processed foods

### After Donation
- Alcohol (for 24 hours)
- Very hot beverages immediately after

## Recovery Nutrition

### Immediate Post-Donation (0-2 hours)
- Light snacks provided at donation center
- Continue hydrating
- Avoid heavy meals

### 24-48 Hours After
- Focus on iron-rich foods
- Include protein for tissue repair
- Maintain increased fluid intake
- Consider iron supplements if recommended

## Special Dietary Considerations

### Vegetarian/Vegan Donors
- Focus on plant-based iron sources
- Combine with Vitamin C
- Consider B12 supplementation
- Monitor iron levels regularly

### Donors with Dietary Restrictions
- Consult with healthcare provider
- Plan alternative iron sources
- Consider nutritional supplements
- Monitor hemoglobin levels closely

Remember: Good nutrition is an ongoing commitment, not just a pre-donation requirement!
    `,
    excerpt: "Essential nutrition guidelines for blood donors, including iron-rich foods, hydration tips, and dietary recommendations for optimal donation health.",
    author: {
      name: "Lisa Chen",
      title: "Registered Dietitian",
      credentials: "RD, MS in Nutrition Science"
    },
    tags: ["nutrition", "iron", "hydration", "health", "recovery"],
    readingTime: 6,
    difficulty: "beginner",
    isPublished: true,
    isFeatured: false,
    publishedAt: new Date('2024-01-20')
  },
  {
    title: "Understanding Blood Types and Compatibility",
    slug: "understanding-blood-types-and-compatibility",
    type: "article",
    category: "medical_info",
    content: `
# Understanding Blood Types and Compatibility

Blood type compatibility is crucial for safe transfusions. Understanding your blood type helps you know who you can help and who can help you.

## The ABO System

### Blood Type Groups
- **Type A**: Has A antigens, anti-B antibodies
- **Type B**: Has B antigens, anti-A antibodies  
- **Type AB**: Has both A and B antigens, no antibodies (Universal Plasma Donor)
- **Type O**: Has no antigens, both anti-A and anti-B antibodies (Universal Red Cell Donor)

## Rh Factor

### Positive vs Negative
- **Rh Positive (85% of population)**: Has Rh antigen
- **Rh Negative (15% of population)**: Lacks Rh antigen

## Compatibility Chart

### Who Can Donate to Whom
- **O-**: Universal donor (can donate to all types)
- **AB+**: Universal recipient (can receive from all types)
- **A+**: Can donate to A+, AB+
- **A-**: Can donate to A+, A-, AB+, AB-
- **B+**: Can donate to B+, AB+
- **B-**: Can donate to B+, B-, AB+, AB-
- **AB-**: Can donate to AB+, AB-
- **O+**: Can donate to A+, B+, AB+, O+

## Special Considerations

### Rare Blood Types
- **Rh-null**: Extremely rare, can donate to all Rh-negative types
- **Duffy negative**: Common in African Americans, important for sickle cell patients
- **Diego positive**: More common in Hispanic and Asian populations

### Emergency Situations
- O-negative used in emergencies when blood type unknown
- Type-specific blood preferred when time allows
- Cross-matching always performed before transfusion

## Why Blood Type Matters

### For Donors
- Determines who can receive your donation
- Affects donation frequency recommendations
- Influences special donation programs (platelets, plasma)

### For Recipients
- Ensures safe transfusion
- Prevents dangerous immune reactions
- Optimizes treatment outcomes

## Getting Tested

### Where to Test
- Blood donation centers
- Healthcare providers
- Home testing kits (less reliable)
- Hospital laboratories

### What to Expect
- Simple blood draw
- Results available same day
- Free testing at most donation centers
- Permanent record for future reference

## Myths vs Facts

**Myth**: Blood type determines personality
**Fact**: No scientific evidence supports this claim

**Myth**: O-negative donors are always in demand
**Fact**: While valuable, all blood types are needed

**Myth**: You can change your blood type
**Fact**: Blood type is determined by genetics and cannot be changed

Understanding your blood type empowers you to make informed decisions about donation and helps save lives in your community!
    `,
    excerpt: "Comprehensive guide to blood types, compatibility, and the science behind safe blood transfusions.",
    author: {
      name: "Dr. Michael Rodriguez",
      title: "Transfusion Medicine Specialist",
      credentials: "MD, Board Certified in Pathology"
    },
    tags: ["blood types", "compatibility", "medical", "science", "transfusion"],
    readingTime: 10,
    difficulty: "intermediate",
    isPublished: true,
    isFeatured: true,
    publishedAt: new Date('2024-01-25')
  },
  {
    title: "Debunking Common Blood Donation Myths",
    slug: "debunking-common-blood-donation-myths",
    type: "article",
    category: "myths_facts",
    content: `
# Debunking Common Blood Donation Myths

Misinformation about blood donation can prevent people from this life-saving act. Let's separate fact from fiction.

## Myth 1: Blood Donation is Painful

**The Reality**: Most donors experience only a brief pinch during needle insertion, similar to a routine blood test. The actual donation is painless, and many donors read, use their phones, or chat during the process.

**Why This Myth Persists**: Fear of needles and medical procedures is common, leading to exaggerated expectations of pain.

## Myth 2: You Can Get Diseases from Donating

**The Reality**: It's impossible to contract diseases from donating blood. All equipment is sterile, single-use, and disposed of immediately after use. The donation process is completely safe.

**The Science**: New, sterile needles and collection bags are used for each donor. There's no risk of contamination or infection.

## Myth 3: Donation Makes You Weak

**The Reality**: Healthy adults can easily spare one pint of blood. Your body replaces the fluid within 24 hours and red blood cells within 4-6 weeks. Most people feel normal immediately after donation.

**Recovery Facts**: 
- Plasma volume restored in 24 hours
- Red blood cells replaced in 4-6 weeks
- No long-term weakness or health effects

## Myth 4: You Need to Be a Certain Weight/Height

**The Reality**: While there are minimum weight requirements (usually 110 lbs), there are no height restrictions. The weight requirement ensures donor safety, not exclusion.

**Safety Rationale**: Weight requirements ensure donors can safely give one pint without adverse effects.

## Myth 5: Older Adults Can't Donate

**The Reality**: Healthy adults can donate well into their senior years. Many centers accept donors up to age 75 or beyond, depending on health status.

**Age Guidelines**:
- Minimum age: Usually 16-17 (varies by location)
- Maximum age: Often 75+, based on health assessment
- Regular donors may continue longer

## Myth 6: Vegetarians Have "Weak" Blood

**The Reality**: Vegetarians and vegans can be excellent donors. Plant-based diets can provide adequate iron and nutrients for healthy blood production.

**Nutritional Facts**: Many plant foods are rich in iron, and vegetarian diets often include plenty of vitamin C, which enhances iron absorption.

## Myth 7: You Can't Donate if You Have Tattoos

**The Reality**: Recent tattoos may require a waiting period (usually 3-12 months), but old tattoos don't disqualify you. The waiting period depends on local regulations and tattoo parlor standards.

**Current Guidelines**: Most centers accept donors with tattoos done at licensed, regulated facilities after a brief waiting period.

## Myth 8: Blood Donation Affects Athletic Performance

**The Reality**: While there may be a temporary slight decrease in performance immediately after donation, most athletes return to normal within a few days to a week.

**Athletic Considerations**:
- Plan donations during off-season or light training periods
- Maintain proper hydration and nutrition
- Most performance impacts are minimal and temporary

## Myth 9: You Need to Fast Before Donating

**The Reality**: You should eat a healthy meal before donating. Fasting can lead to low blood sugar and increase the risk of feeling faint during or after donation.

**Pre-Donation Nutrition**: Eat iron-rich foods and stay well-hydrated for the best donation experience.

## Myth 10: Blood Donations Aren't Really Needed

**The Reality**: Blood is needed constantly. Every 2 seconds, someone in the US needs blood. Only about 3% of eligible people donate annually, creating ongoing shortages.

**The Need**:
- Accident victims
- Surgery patients  
- Cancer patients
- Chronic illness management
- Emergency situations

## The Truth About Blood Donation

Blood donation is:
- Safe and virtually painless
- Vital for community health
- Suitable for most healthy adults
- A quick process (about 1 hour total)
- Rewarding and potentially life-saving

Don't let myths prevent you from this simple act of kindness that can save up to three lives with each donation!
    `,
    excerpt: "Separating fact from fiction about blood donation, addressing common concerns and misconceptions that prevent people from donating.",
    author: {
      name: "Dr. Amanda Foster",
      title: "Blood Bank Medical Director",
      credentials: "MD, MPH in Public Health"
    },
    tags: ["myths", "facts", "education", "safety", "misconceptions"],
    readingTime: 12,
    difficulty: "beginner",
    isPublished: true,
    isFeatured: true,
    publishedAt: new Date('2024-02-01')
  },
  {
    title: "Recovery and Self-Care After Blood Donation",
    slug: "recovery-and-self-care-after-blood-donation",
    type: "guide",
    category: "recovery",
    content: `
# Recovery and Self-Care After Blood Donation

Proper post-donation care ensures your comfort and helps your body recover quickly and safely.

## Immediate Post-Donation Care (0-4 Hours)

### At the Donation Center
- Rest in the observation area for 10-15 minutes
- Enjoy provided refreshments (juice, cookies, crackers)
- Keep pressure bandage on for at least 4 hours
- Report any unusual symptoms to staff immediately

### Leaving the Center
- Move slowly when getting up
- Avoid sudden movements
- Keep donation arm elevated if possible
- Stay in air-conditioned areas if it's hot outside

## First 24 Hours

### Physical Activity
- **Avoid**: Heavy lifting, strenuous exercise, vigorous arm movements
- **OK**: Light walking, desk work, normal daily activities
- **Best**: Take it easy and listen to your body

### Hydration and Nutrition
- Drink extra fluids (water, juice, non-alcoholic beverages)
- Eat iron-rich foods (red meat, spinach, beans, fortified cereals)
- Include vitamin C to enhance iron absorption
- Avoid alcohol for 24 hours

### Bandage Care
- Keep initial bandage on for 4-6 hours
- Replace with smaller bandage if needed
- Keep donation site clean and dry
- Watch for signs of infection (unusual redness, warmth, swelling)

## Days 2-7: Continued Recovery

### Nutrition Focus
- Continue iron-rich diet
- Include protein for tissue repair
- Maintain increased fluid intake
- Consider iron supplements if recommended by healthcare provider

### Activity Guidelines
- Gradually return to normal exercise routine
- Start with light activities and increase intensity slowly
- Pay attention to energy levels
- Rest if feeling unusually tired

### Monitoring Your Health
- Energy levels should return to normal within a few days
- Donation site should heal without complications
- Contact healthcare provider if concerns arise

## When to Seek Medical Attention

### Immediate Concerns (Call 911)
- Severe dizziness or fainting
- Chest pain or difficulty breathing
- Severe allergic reaction symptoms

### Contact Healthcare Provider If:
- Donation site shows signs of infection
- Unusual fatigue persists beyond a week
- Bruising spreads significantly
- Any concerns about your recovery

## Common Post-Donation Experiences

### Normal Reactions
- **Mild fatigue**: Common for 24-48 hours
- **Small bruise**: Normal at needle insertion site
- **Slight soreness**: May last 1-2 days
- **Temporary thirst**: Body's natural response to fluid loss

### Less Common but Normal
- **Light-headedness**: Usually resolves quickly with rest and fluids
- **Nausea**: Often related to not eating enough before donation
- **Arm stiffness**: Gentle movement helps

## Optimizing Your Recovery

### Sleep and Rest
- Get adequate sleep (7-9 hours)
- Take short naps if needed
- Avoid staying up late the night after donation

### Stress Management
- Practice relaxation techniques
- Avoid stressful situations when possible
- Consider meditation or gentle yoga

### Follow-Up Care
- Schedule your next donation (usually 8 weeks later)
- Keep donation card and records
- Note any reactions for future reference

## Special Considerations

### First-Time Donors
- Recovery may take slightly longer
- Pay extra attention to your body's signals
- Don't hesitate to contact donation center with questions

### Regular Donors
- You know your body's typical response
- Still follow all post-donation guidelines
- Report any changes in your usual recovery pattern

### Donors with Health Conditions
- Follow any special instructions from medical staff
- Consult your healthcare provider if you have concerns
- Monitor your condition more closely

## Preparing for Your Next Donation

### Building Back Up
- Maintain healthy diet rich in iron and vitamins
- Stay well-hydrated
- Get regular exercise (improves circulation)
- Manage stress levels

### Scheduling
- Wait the recommended time between donations (usually 8 weeks for whole blood)
- Plan around your schedule and energy needs
- Consider seasonal factors (holidays, work demands)

Remember: Your body is amazing at recovering from blood donation. Following these guidelines helps ensure a smooth, comfortable recovery and prepares you for future donations. Thank you for your life-saving contribution!
    `,
    excerpt: "Complete guide to post-donation recovery, including immediate care, nutrition tips, activity guidelines, and when to seek medical attention.",
    author: {
      name: "Nurse Patricia Williams",
      title: "Donor Care Specialist",
      credentials: "RN, BSN, 15 years donation center experience"
    },
    tags: ["recovery", "self-care", "post-donation", "health", "safety"],
    readingTime: 9,
    difficulty: "beginner",
    isPublished: true,
    isFeatured: false,
    publishedAt: new Date('2024-02-05')
  }
];

const sampleFAQs = [
  {
    question: "How often can I donate blood?",
    answer: "For whole blood donations, you can donate every 8 weeks (56 days). For platelets, you can donate every 7 days, up to 24 times per year. For plasma, you can donate twice per week with at least 48 hours between donations. These intervals ensure your body has adequate time to replenish blood components safely.",
    category: "general",
    tags: ["frequency", "donation intervals", "safety"],
    priority: 95
  },
  {
    question: "What are the basic eligibility requirements for blood donation?",
    answer: "Basic requirements include: being at least 16-17 years old (varies by location), weighing at least 110 pounds, being in good general health, having adequate iron levels (hemoglobin), and not having donated blood in the past 8 weeks. Additional requirements may apply based on travel history, medications, and medical conditions.",
    category: "eligibility",
    tags: ["requirements", "age", "weight", "health"],
    priority: 90
  },
  {
    question: "Will donating blood hurt?",
    answer: "Most donors experience only a brief pinch when the needle is inserted, similar to a routine blood test. The actual donation process is painless. Some donors may feel slight pressure or a pulling sensation, but significant pain is not normal. If you experience unusual pain, inform the staff immediately.",
    category: "donation_process",
    tags: ["pain", "needle", "comfort"],
    priority: 85
  },
  {
    question: "How long does the blood donation process take?",
    answer: "The entire process typically takes 45-60 minutes, including registration, health screening, and post-donation observation. The actual blood collection takes only 8-10 minutes. First-time donors may need additional time for orientation and paperwork.",
    category: "donation_process",
    tags: ["time", "duration", "process"],
    priority: 80
  },
  {
    question: "What should I eat before donating blood?",
    answer: "Eat a healthy, iron-rich meal 3-4 hours before donation. Good choices include lean meats, fish, poultry, beans, spinach, and iron-fortified cereals. Avoid fatty or greasy foods. Also drink plenty of water (16-20 ounces) before arriving. Don't donate on an empty stomach.",
    category: "donation_process",
    tags: ["nutrition", "preparation", "iron", "hydration"],
    priority: 75
  },
  {
    question: "Can I donate if I have a tattoo or piercing?",
    answer: "Recent tattoos or piercings may require a waiting period, typically 3-12 months, depending on local regulations and whether the procedure was done at a licensed facility. Older tattoos and piercings generally don't disqualify you from donating. Check with your local donation center for specific guidelines.",
    category: "eligibility",
    tags: ["tattoos", "piercings", "waiting period"],
    priority: 70
  },
  {
    question: "What happens to my blood after I donate?",
    answer: "Your blood is tested for blood type, infectious diseases, and other factors. If it passes all tests, it's separated into components (red cells, plasma, platelets) that can help multiple patients. The blood is then stored under specific conditions and distributed to hospitals based on need and compatibility.",
    category: "general",
    tags: ["blood processing", "testing", "distribution"],
    priority: 65
  },
  {
    question: "Can I donate if I'm taking medications?",
    answer: "Many medications don't prevent donation, but some do require temporary or permanent deferral. Common medications like blood pressure pills, birth control, and most antibiotics are usually acceptable. However, blood thinners, certain acne medications, and some others may disqualify you. Always inform staff about all medications you're taking.",
    category: "eligibility",
    tags: ["medications", "prescriptions", "deferral"],
    priority: 60
  },
  {
    question: "What are the side effects of blood donation?",
    answer: "Most people experience no side effects. Some may feel mild fatigue, dizziness, or nausea, usually due to not eating enough beforehand. Serious side effects are rare. Common minor effects include slight bruising at the needle site or feeling lightheaded. These typically resolve quickly with rest and fluids.",
    category: "health_safety",
    tags: ["side effects", "reactions", "safety"],
    priority: 55
  },
  {
    question: "How much blood is taken during donation?",
    answer: "A standard whole blood donation is approximately one pint (about 470ml or 16 fluid ounces). This represents less than 10% of your total blood volume. Your body replaces the plasma within 24 hours and the red blood cells within 4-6 weeks.",
    category: "donation_process",
    tags: ["volume", "amount", "recovery"],
    priority: 50
  },
  {
    question: "Can I exercise after donating blood?",
    answer: "Avoid strenuous exercise and heavy lifting for 24 hours after donation. Light activities like walking are fine. Your body needs time to replace the donated blood, and intense exercise too soon could cause dizziness or fatigue. Gradually return to your normal exercise routine after the first day.",
    category: "after_donation",
    tags: ["exercise", "activity", "recovery"],
    priority: 45
  },
  {
    question: "Why was I deferred from donating?",
    answer: "Deferrals protect both donor and recipient safety. Common reasons include low iron levels, recent illness, certain medications, travel to specific areas, or not meeting weight/age requirements. Many deferrals are temporary. Ask the staff for specific information about your deferral and when you might be eligible to try again.",
    category: "eligibility",
    tags: ["deferral", "rejection", "eligibility"],
    priority: 40
  },
  {
    question: "Can I donate if I have high blood pressure?",
    answer: "High blood pressure doesn't automatically disqualify you, but your blood pressure must be within acceptable limits at the time of donation (typically below 180/100). If you're on blood pressure medication and your condition is well-controlled, you can usually donate. Consult with donation center staff about your specific situation.",
    category: "medical_conditions",
    tags: ["blood pressure", "hypertension", "medical conditions"],
    priority: 35
  },
  {
    question: "How do I know my blood type?",
    answer: "Your blood type will be determined during your first donation and provided to you afterward. You can also ask your doctor, check previous medical records, or get tested at a laboratory. Many donation centers provide blood type cards to donors after their first successful donation.",
    category: "general",
    tags: ["blood type", "testing", "identification"],
    priority: 30
  },
  {
    question: "Can I donate if I'm pregnant or breastfeeding?",
    answer: "Pregnant women cannot donate blood due to increased iron needs and potential risks. Breastfeeding mothers can usually donate after 6 weeks postpartum if they're feeling well and have adequate iron levels. It's important to maintain proper nutrition while breastfeeding and donating.",
    category: "eligibility",
    tags: ["pregnancy", "breastfeeding", "postpartum"],
    priority: 25
  }
];

async function seedEducationalContent() {
  try {
    logger.info('Starting educational content seeding...', 'SEED');

    // Clear existing content
    await EducationalContent.deleteMany({});
    await FAQ.deleteMany({});

    // Insert sample content
    const insertedContent = await EducationalContent.insertMany(sampleContent);
    const insertedFAQs = await FAQ.insertMany(sampleFAQs.map(faq => ({
      ...faq,
      updatedBy: 'System Administrator'
    })));

    logger.success(`Seeded ${insertedContent.length} educational content items`, 'SEED');
    logger.success(`Seeded ${insertedFAQs.length} FAQ items`, 'SEED');

    return {
      contentCount: insertedContent.length,
      faqCount: insertedFAQs.length
    };
  } catch (error) {
    logger.error('Error seeding educational content', 'SEED', error);
    throw error;
  }
}

module.exports = { seedEducationalContent };