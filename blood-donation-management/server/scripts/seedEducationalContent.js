const mongoose = require('mongoose');
const EducationalContent = require('../models/EducationalContent');
const FAQ = require('../models/FAQ');
const User = require('../models/User');
const logger = require('../utils/logger');

// Sample educational content data
const educationalContentData = [
  {
    title: 'Complete Guide to Blood Donation Preparation',
    slug: 'complete-guide-to-blood-donation-preparation',
    excerpt: 'Learn everything you need to know about preparing for blood donation, from dietary requirements to what to expect during the process.',
    content: `
# Complete Guide to Blood Donation Preparation

Blood donation is a noble act that can save lives. Proper preparation ensures a safe and comfortable donation experience for you and helps maintain the quality of donated blood.

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

The donation process typically takes 45-60 minutes, including:
1. Registration and health screening (15-20 minutes)
2. Mini-physical examination (5-10 minutes)
3. Blood donation (8-10 minutes)
4. Rest and refreshments (10-15 minutes)

## After Donation

- Rest for 10-15 minutes before leaving
- Drink extra fluids for the next 24 hours
- Avoid heavy lifting or vigorous exercise for 24 hours
- Keep the bandage on for 4-6 hours
- If you feel dizzy, sit down and put your head between your knees

Remember, you're helping save lives with your donation!
    `,
    type: 'guide',
    category: 'preparation',
    difficulty: 'beginner',
    tags: ['preparation', 'safety', 'health', 'first-time'],
    readingTime: 8,
    author: {
      name: 'Dr. Sarah Johnson',
      bio: 'Hematologist with 15 years of experience in blood banking',
      credentials: 'MD, Hematology'
    },
    featuredImage: {
      url: '/images/blood-donation-prep.jpg',
      alt: 'Person preparing for blood donation',
      caption: 'Proper preparation ensures a safe donation experience'
    },
    isPublished: true,
    isFeatured: true,
    publishedAt: new Date('2024-01-15'),
    views: 1250,
    likes: 89,
    shares: 23
  },
  {
    title: 'Nutrition Tips for Blood Donors',
    slug: 'nutrition-tips-for-blood-donors',
    excerpt: 'Essential nutrition guidelines for blood donors to maintain healthy iron levels and optimize donation recovery.',
    content: `
# Nutrition Tips for Blood Donors

Proper nutrition is crucial for blood donors to maintain healthy iron levels and ensure quick recovery after donation.

## Iron-Rich Foods

### Best Sources
- Red meat (beef, lamb)
- Poultry (chicken, turkey)
- Fish and seafood
- Leafy greens (spinach, kale)
- Legumes (lentils, chickpeas)
- Fortified cereals

### Enhancing Iron Absorption
- Consume vitamin C with iron-rich foods
- Citrus fruits, tomatoes, bell peppers
- Avoid tea and coffee with meals
- Cook in cast iron cookware

## Pre-Donation Meal Ideas

### Breakfast Options
- Fortified cereal with orange juice
- Spinach and cheese omelet
- Whole grain toast with peanut butter

### Lunch/Dinner Options
- Grilled chicken with broccoli
- Beef stir-fry with bell peppers
- Lentil soup with tomatoes

## Post-Donation Recovery

- Increase fluid intake
- Eat iron-rich snacks
- Include protein in every meal
- Consider iron supplements if recommended

Stay healthy and keep donating!
    `,
    type: 'article',
    category: 'nutrition',
    difficulty: 'beginner',
    tags: ['nutrition', 'iron', 'health', 'recovery'],
    readingTime: 6,
    author: {
      name: 'Lisa Chen',
      bio: 'Registered Dietitian specializing in donor nutrition',
      credentials: 'RD, MS Nutrition'
    },
    isPublished: true,
    publishedAt: new Date('2024-01-10'),
    views: 890,
    likes: 67,
    shares: 15
  },
  {
    title: 'Understanding Blood Types and Compatibility',
    slug: 'understanding-blood-types-and-compatibility',
    excerpt: 'Learn about different blood types, compatibility rules, and why blood type matching is crucial for safe transfusions.',
    content: `
# Understanding Blood Types and Compatibility

Blood type compatibility is fundamental to safe blood transfusions. Understanding your blood type and how it relates to donation can help save more lives.

## The ABO System

### Blood Types
- **Type A**: Has A antigens, anti-B antibodies
- **Type B**: Has B antigens, anti-A antibodies
- **Type AB**: Has both A and B antigens, no antibodies (Universal Recipient)
- **Type O**: Has no antigens, both anti-A and anti-B antibodies (Universal Donor)

## Rh Factor

The Rh factor adds another layer:
- **Positive (+)**: Has Rh antigen
- **Negative (-)**: Lacks Rh antigen

## Compatibility Rules

### Who Can Donate to Whom
- **O-**: Universal donor (can donate to all types)
- **AB+**: Universal recipient (can receive from all types)
- **A+**: Can donate to A+ and AB+
- **B+**: Can donate to B+ and AB+

### Emergency Situations
In emergencies, O- blood is used when there's no time for cross-matching.

## Why It Matters

Incompatible blood can cause:
- Hemolytic reactions
- Kidney failure
- Shock
- Death in severe cases

Always ensure proper blood typing and cross-matching!
    `,
    type: 'article',
    category: 'medical_info',
    difficulty: 'intermediate',
    tags: ['blood-types', 'compatibility', 'medical', 'safety'],
    readingTime: 10,
    author: {
      name: 'Dr. Michael Rodriguez',
      bio: 'Blood Bank Medical Director',
      credentials: 'MD, Pathology, Blood Banking'
    },
    isPublished: true,
    publishedAt: new Date('2024-01-08'),
    views: 1456,
    likes: 112,
    shares: 34
  },
  {
    title: 'Debunking Common Blood Donation Myths',
    slug: 'debunking-common-blood-donation-myths',
    excerpt: 'Separating fact from fiction about blood donation to help more people become confident donors.',
    content: `
# Debunking Common Blood Donation Myths

Many misconceptions prevent people from donating blood. Let's separate fact from fiction.

## Myth 1: "Blood donation is painful"
**Fact**: The needle insertion feels like a quick pinch. Most donors report minimal discomfort.

## Myth 2: "I might get infected"
**Fact**: All equipment is sterile and single-use. There's zero risk of infection from donating.

## Myth 3: "I'll feel weak for days"
**Fact**: Most people feel normal within hours. Your body replaces the donated blood quickly.

## Myth 4: "I can't donate if I have tattoos"
**Fact**: You can donate if your tattoo was done at a licensed facility with sterile equipment.

## Myth 5: "Vegetarians can't donate"
**Fact**: Vegetarians can donate if they maintain adequate iron levels through diet.

## Myth 6: "I'm too old/young to donate"
**Fact**: Healthy individuals aged 18-65 can typically donate.

## Myth 7: "My blood type isn't needed"
**Fact**: All blood types are needed. Some are rarer and more urgently needed.

## The Truth About Donation

- Safe and regulated process
- Saves up to 3 lives per donation
- Takes only 8-10 minutes of actual donation time
- Body replaces donated blood within 24-48 hours

Don't let myths stop you from saving lives!
    `,
    type: 'article',
    category: 'myths_facts',
    difficulty: 'beginner',
    tags: ['myths', 'facts', 'education', 'awareness'],
    readingTime: 7,
    author: {
      name: 'Dr. Priya Sharma',
      bio: 'Public Health Specialist and Blood Donation Advocate',
      credentials: 'MD, MPH'
    },
    isPublished: true,
    isFeatured: true,
    publishedAt: new Date('2024-01-12'),
    views: 2103,
    likes: 156,
    shares: 67
  },
  {
    title: 'Recovery and Care After Blood Donation',
    slug: 'recovery-and-care-after-blood-donation',
    excerpt: 'Essential post-donation care tips to ensure quick recovery and prepare for your next donation.',
    content: `
# Recovery and Care After Blood Donation

Proper post-donation care ensures quick recovery and helps you maintain good health for future donations.

## Immediate Post-Donation (First 2 Hours)

### Rest Period
- Stay in the observation area for 10-15 minutes
- Drink fluids provided by the blood bank
- Eat the snacks offered
- Don't rush to leave

### Warning Signs to Watch For
- Dizziness or lightheadedness
- Nausea
- Excessive bleeding from needle site
- Unusual fatigue

## First 24 Hours

### Do's
- Drink extra fluids (water, juice, but avoid alcohol)
- Eat iron-rich foods
- Keep the bandage on for 4-6 hours
- Rest if you feel tired
- Take it easy with physical activities

### Don'ts
- Don't lift heavy objects (over 25 lbs)
- Avoid vigorous exercise
- Don't smoke for at least 2 hours
- Don't drink alcohol

## Days 2-7: Full Recovery

### Nutrition Focus
- Continue eating iron-rich foods
- Include vitamin C to enhance iron absorption
- Stay well-hydrated
- Consider iron supplements if recommended

### Activity Level
- Gradually return to normal activities
- Listen to your body
- Resume exercise when you feel ready

## When to Contact Medical Help

Call your doctor or the blood bank if you experience:
- Persistent dizziness after 24 hours
- Signs of infection at needle site
- Unusual fatigue lasting more than 2 days
- Any concerning symptoms

## Preparing for Next Donation

- Wait at least 56 days between whole blood donations
- Maintain healthy iron levels
- Stay hydrated
- Get adequate sleep

Your body is amazing at recovery - trust the process!
    `,
    type: 'guide',
    category: 'recovery',
    difficulty: 'beginner',
    tags: ['recovery', 'post-donation', 'care', 'health'],
    readingTime: 9,
    author: {
      name: 'Nurse Jennifer Williams',
      bio: 'Registered Nurse with 12 years in blood collection',
      credentials: 'RN, BSN'
    },
    isPublished: true,
    publishedAt: new Date('2024-01-05'),
    views: 743,
    likes: 54,
    shares: 12
  }
];

// Sample FAQ data
const faqData = [
  {
    question: 'Who can donate blood?',
    answer: 'Generally, healthy individuals aged 18-65 who weigh at least 50kg can donate blood. You must be in good health, not taking certain medications, and meet other eligibility criteria determined during the screening process.',
    category: 'eligibility',
    tags: ['eligibility', 'age', 'weight', 'health'],
    priority: 100,
    isPublished: true,
    helpful: 45,
    notHelpful: 3,
    views: 892
  },
  {
    question: 'How often can I donate blood?',
    answer: 'You can donate whole blood every 56 days (8 weeks). For platelets, you can donate every 7 days, up to 24 times per year. For plasma, donations can be made every 28 days.',
    category: 'donation_process',
    tags: ['frequency', 'donation', 'schedule'],
    priority: 95,
    isPublished: true,
    helpful: 38,
    notHelpful: 2,
    views: 654
  },
  {
    question: 'Is blood donation safe?',
    answer: 'Yes, blood donation is very safe. All equipment is sterile and used only once. There is no risk of contracting any disease from donating blood. The process is conducted by trained professionals following strict safety protocols.',
    category: 'safety',
    tags: ['safety', 'sterile', 'risk'],
    priority: 90,
    isPublished: true,
    helpful: 52,
    notHelpful: 1,
    views: 1023
  },
  {
    question: 'What should I eat before donating blood?',
    answer: 'Eat a healthy meal 3-4 hours before donation. Include iron-rich foods like lean meat, fish, poultry, beans, or iron-fortified cereals. Avoid fatty foods and drink plenty of water. Don\'t donate on an empty stomach.',
    category: 'preparation',
    tags: ['nutrition', 'preparation', 'iron', 'meal'],
    priority: 85,
    isPublished: true,
    helpful: 41,
    notHelpful: 4,
    views: 567
  },
  {
    question: 'How long does the donation process take?',
    answer: 'The entire process takes about 45-60 minutes. This includes registration (15-20 min), health screening (5-10 min), actual donation (8-10 min), and rest period (10-15 min). The actual blood collection only takes 8-10 minutes.',
    category: 'donation_process',
    tags: ['time', 'process', 'duration'],
    priority: 80,
    isPublished: true,
    helpful: 33,
    notHelpful: 2,
    views: 445
  },
  {
    question: 'Can I donate if I have tattoos or piercings?',
    answer: 'Yes, you can donate if your tattoo or piercing was done at a licensed facility using sterile equipment. You may need to wait 3-12 months depending on local regulations and where the procedure was performed.',
    category: 'eligibility',
    tags: ['tattoos', 'piercings', 'eligibility'],
    priority: 75,
    isPublished: true,
    helpful: 29,
    notHelpful: 5,
    views: 378
  },
  {
    question: 'What happens to my blood after donation?',
    answer: 'Your blood is tested for blood type, infectious diseases, and other factors. It\'s then processed into components (red cells, plasma, platelets) and stored until needed. Each donation can help save up to 3 lives.',
    category: 'donation_process',
    tags: ['processing', 'testing', 'components'],
    priority: 70,
    isPublished: true,
    helpful: 36,
    notHelpful: 3,
    views: 512
  },
  {
    question: 'Will I feel weak after donating blood?',
    answer: 'Most people feel fine after donating. You might feel slightly tired, but this usually passes quickly. Drink plenty of fluids, eat iron-rich foods, and avoid strenuous activities for 24 hours. Your body replaces the donated blood within days.',
    category: 'recovery',
    tags: ['recovery', 'weakness', 'fatigue'],
    priority: 65,
    isPublished: true,
    helpful: 27,
    notHelpful: 6,
    views: 334
  },
  {
    question: 'Can I donate if I\'m taking medications?',
    answer: 'It depends on the medication. Many common medications don\'t prevent donation, but some do. Bring a list of your medications to the screening. The medical staff will determine if you\'re eligible to donate.',
    category: 'eligibility',
    tags: ['medications', 'drugs', 'eligibility'],
    priority: 60,
    isPublished: true,
    helpful: 31,
    notHelpful: 4,
    views: 289
  },
  {
    question: 'What is the most needed blood type?',
    answer: 'O-negative is the universal donor type and is always in high demand. However, all blood types are needed. Type O-positive is the most common and frequently needed for emergencies.',
    category: 'medical_info',
    tags: ['blood-types', 'universal-donor', 'demand'],
    priority: 55,
    isPublished: true,
    helpful: 24,
    notHelpful: 2,
    views: 456
  }
];

async function seedEducationalContent() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/bdms';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB for seeding', 'SEED_EDUCATION');

    // Find or create a default admin user for content creation
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      // Create a default admin user for seeding
      adminUser = new User({
        name: 'System Admin',
        phoneNumber: '9999999999',
        email: 'info@callforbloodfoundation.com',
        password: 'hashedpassword', // This would be properly hashed in real scenario
        dateOfBirth: new Date('1990-01-01'),
        gender: 'other',
        bloodType: 'O+',
        weight: 70,
        address: {
          street: 'System Address',
          city: 'System City',
          state: 'System State',
          pincode: '000000',
          country: 'India'
        },
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139]
        },
        role: 'admin',
        status: 'active',
        verification: {
          phoneVerified: true,
          emailVerified: true,
          documentsVerified: true,
          medicallyCleared: true
        }
      });
      await adminUser.save();
      logger.info('Created default admin user for seeding', 'SEED_EDUCATION');
    }

    // Clear existing educational content and FAQs
    await EducationalContent.deleteMany({});
    await FAQ.deleteMany({});
    logger.info('Cleared existing educational content and FAQs', 'SEED_EDUCATION');

    // Seed educational content
    const contentPromises = educationalContentData.map(contentData => {
      const content = new EducationalContent({
        ...contentData,
        createdBy: adminUser._id,
        updatedBy: adminUser._id
      });
      return content.save();
    });

    const createdContent = await Promise.all(contentPromises);
    logger.success(`Created ${createdContent.length} educational content items`, 'SEED_EDUCATION');

    // Seed FAQs
    const faqPromises = faqData.map(faqItem => {
      const faq = new FAQ({
        ...faqItem,
        createdBy: adminUser._id,
        updatedBy: adminUser._id,
        publishedAt: new Date()
      });
      return faq.save();
    });

    const createdFAQs = await Promise.all(faqPromises);
    logger.success(`Created ${createdFAQs.length} FAQ items`, 'SEED_EDUCATION');

    // Add some related content relationships
    if (createdContent.length >= 3) {
      createdContent[0].relatedContent = [createdContent[1]._id, createdContent[2]._id];
      createdContent[1].relatedContent = [createdContent[0]._id, createdContent[3]._id];
      createdContent[2].relatedContent = [createdContent[0]._id, createdContent[4]._id];
      
      await Promise.all([
        createdContent[0].save(),
        createdContent[1].save(),
        createdContent[2].save()
      ]);
      
      logger.info('Added related content relationships', 'SEED_EDUCATION');
    }

    // Add some related FAQ relationships
    if (createdFAQs.length >= 5) {
      createdFAQs[0].relatedFAQs = [createdFAQs[1]._id, createdFAQs[2]._id];
      createdFAQs[1].relatedFAQs = [createdFAQs[0]._id, createdFAQs[3]._id];
      
      await Promise.all([
        createdFAQs[0].save(),
        createdFAQs[1].save()
      ]);
      
      logger.info('Added related FAQ relationships', 'SEED_EDUCATION');
    }

    logger.success('Educational content seeding completed successfully!', 'SEED_EDUCATION');
    
    // Display summary
    console.log('\n=== SEEDING SUMMARY ===');
    console.log(`✅ Educational Content: ${createdContent.length} items`);
    console.log(`✅ FAQs: ${createdFAQs.length} items`);
    console.log(`✅ Admin User: ${adminUser.name} (${adminUser.phoneNumber})`);
    console.log('========================\n');

  } catch (error) {
    logger.error('Error seeding educational content', 'SEED_EDUCATION', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB', 'SEED_EDUCATION');
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedEducationalContent()
    .then(() => {
      console.log('Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedEducationalContent;