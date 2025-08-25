require('dotenv').config();
const mongoose = require('mongoose');
const Institution = require('../models/Institution');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Sample institutions data for Hyderabad
const institutionsData = [
  // Medical Colleges
  {
    name: "Osmania Medical College",
    type: "medical_center",
    registrationNumber: "OMC001",
    licenseNumber: "LIC-OMC-2024",
    contactInfo: {
      email: "info@osmaniamedical.edu.in",
      phone: "+91-40-24600146",
      alternatePhone: "+91-40-24600147",
      website: "https://www.osmaniamedical.edu.in"
    },
    address: {
      street: "Koti, Afzal Gunj",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500095",
      country: "India",
      coordinates: {
        latitude: 17.3616,
        longitude: 78.4747
      }
    },
    adminContact: {
      name: "Dr. Rajesh Kumar",
      designation: "Dean",
      email: "dean@osmaniamedical.edu.in",
      phone: "+91-40-24600146"
    },
    operatingHours: {
      monday: { start: "08:00", end: "18:00", closed: false },
      tuesday: { start: "08:00", end: "18:00", closed: false },
      wednesday: { start: "08:00", end: "18:00", closed: false },
      thursday: { start: "08:00", end: "18:00", closed: false },
      friday: { start: "08:00", end: "18:00", closed: false },
      saturday: { start: "08:00", end: "14:00", closed: false },
      sunday: { start: "", end: "", closed: true }
    },
    services: ["blood_collection", "blood_testing", "health_checkup", "donor_counseling"],
    capacity: {
      dailyCollectionCapacity: 100,
      storageCapacity: 200,
      staffCount: 50,
      bedsCount: 500
    },
    verificationStatus: "verified",
    partnershipStatus: "active",
    inventoryEnabled: true,
    status: "active"
  },
  {
    name: "Gandhi Medical College",
    type: "medical_center",
    registrationNumber: "GMC002",
    licenseNumber: "LIC-GMC-2024",
    contactInfo: {
      email: "info@gandhimedical.edu.in",
      phone: "+91-40-24754224",
      alternatePhone: "+91-40-24754225",
      website: "https://www.gandhimedical.edu.in"
    },
    address: {
      street: "Musheerabad",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500020",
      country: "India",
      coordinates: {
        latitude: 17.4239,
        longitude: 78.4738
      }
    },
    adminContact: {
      name: "Dr. Priya Sharma",
      designation: "Principal",
      email: "principal@gandhimedical.edu.in",
      phone: "+91-40-24754224"
    },
    operatingHours: {
      monday: { start: "08:00", end: "18:00", closed: false },
      tuesday: { start: "08:00", end: "18:00", closed: false },
      wednesday: { start: "08:00", end: "18:00", closed: false },
      thursday: { start: "08:00", end: "18:00", closed: false },
      friday: { start: "08:00", end: "18:00", closed: false },
      saturday: { start: "08:00", end: "14:00", closed: false },
      sunday: { start: "", end: "", closed: true }
    },
    services: ["blood_collection", "blood_testing", "health_checkup", "emergency_services"],
    capacity: {
      dailyCollectionCapacity: 80,
      storageCapacity: 150,
      staffCount: 45,
      bedsCount: 400
    },
    verificationStatus: "verified",
    partnershipStatus: "active",
    inventoryEnabled: true,
    status: "active"
  },
  // NGOs and Blood Donation Organizations
  {
    name: "Jeevandan Blood Bank",
    type: "blood_bank",
    registrationNumber: "JBB003",
    licenseNumber: "LIC-JBB-2024",
    contactInfo: {
      email: "info@jeevandan.gov.in",
      phone: "+91-40-23120333",
      alternatePhone: "+91-40-23120334",
      website: "https://www.jeevandan.gov.in"
    },
    address: {
      street: "Koti, Near Government Hospital",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500095",
      country: "India",
      coordinates: {
        latitude: 17.3650,
        longitude: 78.4750
      }
    },
    adminContact: {
      name: "Dr. Venkat Reddy",
      designation: "Director",
      email: "director@jeevandan.gov.in",
      phone: "+91-40-23120333"
    },
    operatingHours: {
      monday: { start: "06:00", end: "22:00", closed: false },
      tuesday: { start: "06:00", end: "22:00", closed: false },
      wednesday: { start: "06:00", end: "22:00", closed: false },
      thursday: { start: "06:00", end: "22:00", closed: false },
      friday: { start: "06:00", end: "22:00", closed: false },
      saturday: { start: "06:00", end: "22:00", closed: false },
      sunday: { start: "06:00", end: "22:00", closed: false }
    },
    services: ["blood_collection", "blood_testing", "blood_storage", "blood_distribution", "platelet_donation", "plasma_donation", "emergency_services", "mobile_collection"],
    capacity: {
      dailyCollectionCapacity: 200,
      storageCapacity: 1000,
      staffCount: 30,
      bedsCount: 50
    },
    verificationStatus: "verified",
    partnershipStatus: "active",
    inventoryEnabled: true,
    status: "active"
  },
  {
    name: "Rotary Blood Bank Hyderabad",
    type: "ngo",
    registrationNumber: "RBB004",
    licenseNumber: "LIC-RBB-2024",
    contactInfo: {
      email: "info@rotarybloodbank.org",
      phone: "+91-40-27613456",
      alternatePhone: "+91-40-27613457",
      website: "https://www.rotarybloodbank.org"
    },
    address: {
      street: "Somajiguda, Near NIMS Hospital",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500082",
      country: "India",
      coordinates: {
        latitude: 17.4239,
        longitude: 78.4482
      }
    },
    adminContact: {
      name: "Mr. Suresh Babu",
      designation: "President",
      email: "president@rotarybloodbank.org",
      phone: "+91-40-27613456"
    },
    operatingHours: {
      monday: { start: "09:00", end: "17:00", closed: false },
      tuesday: { start: "09:00", end: "17:00", closed: false },
      wednesday: { start: "09:00", end: "17:00", closed: false },
      thursday: { start: "09:00", end: "17:00", closed: false },
      friday: { start: "09:00", end: "17:00", closed: false },
      saturday: { start: "09:00", end: "15:00", closed: false },
      sunday: { start: "", end: "", closed: true }
    },
    services: ["blood_collection", "donor_counseling", "mobile_collection", "health_checkup"],
    capacity: {
      dailyCollectionCapacity: 50,
      storageCapacity: 100,
      staffCount: 15,
      bedsCount: 20
    },
    verificationStatus: "verified",
    partnershipStatus: "active",
    inventoryEnabled: false,
    status: "active"
  },
  {
    name: "Lions Blood Bank Secunderabad",
    type: "ngo",
    registrationNumber: "LBB005",
    licenseNumber: "LIC-LBB-2024",
    contactInfo: {
      email: "info@lionsbloodbank.org",
      phone: "+91-40-27842345",
      alternatePhone: "+91-40-27842346",
      website: "https://www.lionsbloodbank.org"
    },
    address: {
      street: "SP Road, Secunderabad",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500003",
      country: "India",
      coordinates: {
        latitude: 17.4399,
        longitude: 78.4983
      }
    },
    adminContact: {
      name: "Mrs. Lakshmi Devi",
      designation: "Secretary",
      email: "secretary@lionsbloodbank.org",
      phone: "+91-40-27842345"
    },
    operatingHours: {
      monday: { start: "09:00", end: "17:00", closed: false },
      tuesday: { start: "09:00", end: "17:00", closed: false },
      wednesday: { start: "09:00", end: "17:00", closed: false },
      thursday: { start: "09:00", end: "17:00", closed: false },
      friday: { start: "09:00", end: "17:00", closed: false },
      saturday: { start: "09:00", end: "15:00", closed: false },
      sunday: { start: "", end: "", closed: true }
    },
    services: ["blood_collection", "donor_counseling", "mobile_collection"],
    capacity: {
      dailyCollectionCapacity: 40,
      storageCapacity: 80,
      staffCount: 12,
      bedsCount: 15
    },
    verificationStatus: "verified",
    partnershipStatus: "active",
    inventoryEnabled: false,
    status: "active"
  },
  // Government Health Institutions
  {
    name: "Telangana State Blood Transfusion Council",
    type: "medical_center",
    registrationNumber: "TSBTC006",
    licenseNumber: "LIC-TSBTC-2024",
    contactInfo: {
      email: "info@tsbtc.gov.in",
      phone: "+91-40-23456789",
      alternatePhone: "+91-40-23456790",
      website: "https://www.tsbtc.gov.in"
    },
    address: {
      street: "Secretariat, Hyderabad",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500022",
      country: "India",
      coordinates: {
        latitude: 17.3753,
        longitude: 78.4744
      }
    },
    adminContact: {
      name: "Dr. Madhavi Reddy",
      designation: "Director",
      email: "director@tsbtc.gov.in",
      phone: "+91-40-23456789"
    },
    operatingHours: {
      monday: { start: "10:00", end: "17:00", closed: false },
      tuesday: { start: "10:00", end: "17:00", closed: false },
      wednesday: { start: "10:00", end: "17:00", closed: false },
      thursday: { start: "10:00", end: "17:00", closed: false },
      friday: { start: "10:00", end: "17:00", closed: false },
      saturday: { start: "10:00", end: "14:00", closed: false },
      sunday: { start: "", end: "", closed: true }
    },
    services: ["blood_testing", "blood_storage", "blood_distribution", "donor_counseling"],
    capacity: {
      dailyCollectionCapacity: 150,
      storageCapacity: 500,
      staffCount: 25,
      bedsCount: 30
    },
    verificationStatus: "verified",
    partnershipStatus: "active",
    inventoryEnabled: true,
    status: "active"
  },
  {
    name: "NIMS Blood Bank",
    type: "hospital",
    registrationNumber: "NIMS007",
    licenseNumber: "LIC-NIMS-2024",
    contactInfo: {
      email: "bloodbank@nims.edu.in",
      phone: "+91-40-23489000",
      alternatePhone: "+91-40-23489001",
      website: "https://www.nims.edu.in"
    },
    address: {
      street: "Punjagutta",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500082",
      country: "India",
      coordinates: {
        latitude: 17.4239,
        longitude: 78.4482
      }
    },
    adminContact: {
      name: "Dr. Ramesh Kumar",
      designation: "Blood Bank Officer",
      email: "bloodbank@nims.edu.in",
      phone: "+91-40-23489000"
    },
    operatingHours: {
      monday: { start: "08:00", end: "20:00", closed: false },
      tuesday: { start: "08:00", end: "20:00", closed: false },
      wednesday: { start: "08:00", end: "20:00", closed: false },
      thursday: { start: "08:00", end: "20:00", closed: false },
      friday: { start: "08:00", end: "20:00", closed: false },
      saturday: { start: "08:00", end: "18:00", closed: false },
      sunday: { start: "08:00", end: "18:00", closed: false }
    },
    services: ["blood_collection", "blood_testing", "blood_storage", "blood_distribution", "platelet_donation", "emergency_services"],
    capacity: {
      dailyCollectionCapacity: 120,
      storageCapacity: 300,
      staffCount: 20,
      bedsCount: 25
    },
    verificationStatus: "verified",
    partnershipStatus: "active",
    inventoryEnabled: true,
    status: "active"
  }
];

async function seedInstitutions() {
  try {
    console.log('ℹ️ [SEED_INSTITUTIONS]: Connected to MongoDB for institution seeding');
    
    // Find or create admin user
    let adminUser = await User.findOne({ phoneNumber: '9988776655' });
    
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('Admin@123', 12);
      adminUser = new User({
        name: 'System Admin',
        phoneNumber: '9988776655',
        email: 'info@callforbloodfoundation.com',
        password: hashedPassword,
        dateOfBirth: new Date('1985-01-01'),
        gender: 'male',
        bloodType: 'O+',
        weight: 70,
        height: 175,
        address: {
          street: 'Admin Office, Secretariat',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500022',
          country: 'India'
        },
        location: {
          type: 'Point',
          coordinates: [78.4744, 17.3753] // [longitude, latitude]
        },
        role: 'admin',
        status: 'active',
        verification: {
          phoneVerified: true,
          emailVerified: true,
          documentsVerified: true,
          medicallyCleared: true,
          verifiedAt: new Date()
        },
        medicalInfo: {
          eligibleForDonation: true
        }
      });
      await adminUser.save();
    }

    // Clear existing institutions
    await Institution.deleteMany({});
    console.log('ℹ️ [SEED_INSTITUTIONS]: Cleared existing institutions');

    // Add createdBy and lastUpdatedBy to each institution
    const institutionsWithAdmin = institutionsData.map(institution => ({
      ...institution,
      createdBy: adminUser._id,
      lastUpdatedBy: adminUser._id,
      verificationDate: new Date(),
      partnershipDate: new Date()
    }));

    // Insert institutions
    const createdInstitutions = await Institution.insertMany(institutionsWithAdmin);
    console.log(`✅ [SEED_INSTITUTIONS]: Created ${createdInstitutions.length} institutions in Hyderabad`);

    // Count by type
    const medicalCenters = createdInstitutions.filter(inst => inst.type === 'medical_center').length;
    const bloodBanks = createdInstitutions.filter(inst => inst.type === 'blood_bank').length;
    const hospitals = createdInstitutions.filter(inst => inst.type === 'hospital').length;
    const ngos = createdInstitutions.filter(inst => inst.type === 'ngo').length;

    console.log('✅ [SEED_INSTITUTIONS]: Institution seeding completed successfully!');
    console.log('\n=== INSTITUTION SEEDING SUMMARY ===');
    console.log(`✅ Medical Centers: ${medicalCenters} items`);
    console.log(`✅ Blood Banks: ${bloodBanks} items`);
    console.log(`✅ Hospitals: ${hospitals} items`);
    console.log(`✅ NGOs: ${ngos} items`);
    console.log(`✅ Admin User: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.phone})`);
    console.log('===================================');

  } catch (error) {
    console.error('❌ [SEED_INSTITUTIONS]: Error seeding institutions:', error);
    throw error;
  }
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await seedInstitutions();
    console.log('\nℹ️ [SEED_INSTITUTIONS]: Disconnected from MongoDB');
    console.log('Institution seeding completed successfully!');
  } catch (error) {
    console.error('❌ [SEED_INSTITUTIONS]: Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedInstitutions };