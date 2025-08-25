const mongoose = require('mongoose');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const logger = require('../utils/logger');
require('dotenv').config();

// Sample hospital data for Hyderabad
const hyderabadHospitalsData = [
  {
    name: 'Apollo Hospitals Jubilee Hills',
    type: 'hospital',
    registrationNumber: 'APL-HYD-001',
    location: {
      type: 'Point',
      coordinates: [78.4089, 17.4326] // Jubilee Hills coordinates
    },
    address: {
      street: 'Road No. 72, Film Nagar, Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500033',
      country: 'India'
    },
    contactInfo: {
      phone: '+91-40-23607777',
      email: 'info.jubileehills@apollohospitals.com',
      website: 'https://www.apollohospitals.com',
      emergencyContact: '+91-40-23607777'
    },
    operatingHours: {
      monday: { open: '00:00', close: '23:59', is24Hours: true },
      tuesday: { open: '00:00', close: '23:59', is24Hours: true },
      wednesday: { open: '00:00', close: '23:59', is24Hours: true },
      thursday: { open: '00:00', close: '23:59', is24Hours: true },
      friday: { open: '00:00', close: '23:59', is24Hours: true },
      saturday: { open: '00:00', close: '23:59', is24Hours: true },
      sunday: { open: '00:00', close: '23:59', is24Hours: true }
    },
    services: [
      'blood_donation',
      'blood_testing',
      'blood_storage',
      'emergency_services',
      'blood_component_separation',
      'cross_matching',
      'blood_screening'
    ],
    certifications: [
      {
        name: 'NABH Accreditation',
        issuedBy: 'National Accreditation Board for Hospitals',
        issuedDate: new Date('2023-01-15'),
        expiryDate: new Date('2026-01-15'),
        certificateNumber: 'NABH-2023-001'
      }
    ],
    verificationStatus: 'verified',
    isActive: true,
    totalDonationsReceived: 1250,
    totalRequestsFulfilled: 980,
    averageRating: 4.5
  },
  {
    name: 'KIMS Hospital Secunderabad',
    type: 'hospital',
    registrationNumber: 'KIMS-HYD-002',
    location: {
      type: 'Point',
      coordinates: [78.4983, 17.4399] // Secunderabad coordinates
    },
    address: {
      street: '1-8-31/1, Minister Rd, Krishna Nagar Colony',
      city: 'Secunderabad',
      state: 'Telangana',
      pincode: '500003',
      country: 'India'
    },
    contactInfo: {
      phone: '+91-40-44885000',
      email: 'info@kimshospitals.com',
      website: 'https://www.kimshospitals.com',
      emergencyContact: '+91-40-44885000'
    },
    operatingHours: {
      monday: { open: '00:00', close: '23:59', is24Hours: true },
      tuesday: { open: '00:00', close: '23:59', is24Hours: true },
      wednesday: { open: '00:00', close: '23:59', is24Hours: true },
      thursday: { open: '00:00', close: '23:59', is24Hours: true },
      friday: { open: '00:00', close: '23:59', is24Hours: true },
      saturday: { open: '00:00', close: '23:59', is24Hours: true },
      sunday: { open: '00:00', close: '23:59', is24Hours: true }
    },
    services: [
      'blood_donation',
      'blood_testing',
      'blood_storage',
      'platelet_donation',
      'emergency_services',
      'blood_component_separation',
      'cross_matching'
    ],
    certifications: [
      {
        name: 'JCI Accreditation',
        issuedBy: 'Joint Commission International',
        issuedDate: new Date('2022-06-10'),
        expiryDate: new Date('2025-06-10'),
        certificateNumber: 'JCI-2022-KIMS'
      }
    ],
    verificationStatus: 'verified',
    isActive: true,
    totalDonationsReceived: 890,
    totalRequestsFulfilled: 720,
    averageRating: 4.3
  },
  {
    name: 'Yashoda Hospitals Malakpet',
    type: 'hospital',
    registrationNumber: 'YAS-HYD-003',
    location: {
      type: 'Point',
      coordinates: [78.5014, 17.3850] // Malakpet coordinates
    },
    address: {
      street: 'Raj Bhavan Rd, Somajiguda',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500082',
      country: 'India'
    },
    contactInfo: {
      phone: '+91-40-67122222',
      email: 'info@yashodahospitals.com',
      website: 'https://www.yashodahospitals.com',
      emergencyContact: '+91-40-67122222'
    },
    operatingHours: {
      monday: { open: '00:00', close: '23:59', is24Hours: true },
      tuesday: { open: '00:00', close: '23:59', is24Hours: true },
      wednesday: { open: '00:00', close: '23:59', is24Hours: true },
      thursday: { open: '00:00', close: '23:59', is24Hours: true },
      friday: { open: '00:00', close: '23:59', is24Hours: true },
      saturday: { open: '00:00', close: '23:59', is24Hours: true },
      sunday: { open: '00:00', close: '23:59', is24Hours: true }
    },
    services: [
      'blood_donation',
      'blood_testing',
      'blood_storage',
      'platelet_donation',
      'plasma_donation',
      'emergency_services',
      'mobile_blood_drive'
    ],
    certifications: [
      {
        name: 'NABH Accreditation',
        issuedBy: 'National Accreditation Board for Hospitals',
        issuedDate: new Date('2023-03-20'),
        expiryDate: new Date('2026-03-20'),
        certificateNumber: 'NABH-2023-YAS'
      }
    ],
    verificationStatus: 'verified',
    isActive: true,
    totalDonationsReceived: 675,
    totalRequestsFulfilled: 540,
    averageRating: 4.2
  },
  {
    name: 'Continental Hospitals Gachibowli',
    type: 'hospital',
    registrationNumber: 'CON-HYD-004',
    location: {
      type: 'Point',
      coordinates: [78.3428, 17.4435] // Gachibowli coordinates
    },
    address: {
      street: 'IT Park Rd, Nanakram Guda, Gachibowli',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500032',
      country: 'India'
    },
    contactInfo: {
      phone: '+91-40-67000000',
      email: 'info@continentalhospitals.com',
      website: 'https://www.continentalhospitals.com',
      emergencyContact: '+91-40-67000000'
    },
    operatingHours: {
      monday: { open: '00:00', close: '23:59', is24Hours: true },
      tuesday: { open: '00:00', close: '23:59', is24Hours: true },
      wednesday: { open: '00:00', close: '23:59', is24Hours: true },
      thursday: { open: '00:00', close: '23:59', is24Hours: true },
      friday: { open: '00:00', close: '23:59', is24Hours: true },
      saturday: { open: '00:00', close: '23:59', is24Hours: true },
      sunday: { open: '00:00', close: '23:59', is24Hours: true }
    },
    services: [
      'blood_donation',
      'blood_testing',
      'blood_storage',
      'emergency_services',
      'blood_component_separation',
      'cross_matching',
      'blood_screening'
    ],
    certifications: [
      {
        name: 'JCI Accreditation',
        issuedBy: 'Joint Commission International',
        issuedDate: new Date('2022-11-15'),
        expiryDate: new Date('2025-11-15'),
        certificateNumber: 'JCI-2022-CON'
      }
    ],
    verificationStatus: 'verified',
    isActive: true,
    totalDonationsReceived: 520,
    totalRequestsFulfilled: 410,
    averageRating: 4.4
  },
  {
    name: 'Care Hospitals Banjara Hills',
    type: 'hospital',
    registrationNumber: 'CARE-HYD-005',
    location: {
      type: 'Point',
      coordinates: [78.4482, 17.4126] // Banjara Hills coordinates
    },
    address: {
      street: 'Road No. 1, Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500034',
      country: 'India'
    },
    contactInfo: {
      phone: '+91-40-61656565',
      email: 'info@carehospitals.com',
      website: 'https://www.carehospitals.com',
      emergencyContact: '+91-40-61656565'
    },
    operatingHours: {
      monday: { open: '00:00', close: '23:59', is24Hours: true },
      tuesday: { open: '00:00', close: '23:59', is24Hours: true },
      wednesday: { open: '00:00', close: '23:59', is24Hours: true },
      thursday: { open: '00:00', close: '23:59', is24Hours: true },
      friday: { open: '00:00', close: '23:59', is24Hours: true },
      saturday: { open: '00:00', close: '23:59', is24Hours: true },
      sunday: { open: '00:00', close: '23:59', is24Hours: true }
    },
    services: [
      'blood_donation',
      'blood_testing',
      'blood_storage',
      'platelet_donation',
      'emergency_services',
      'blood_component_separation'
    ],
    certifications: [
      {
        name: 'NABH Accreditation',
        issuedBy: 'National Accreditation Board for Hospitals',
        issuedDate: new Date('2023-05-10'),
        expiryDate: new Date('2026-05-10'),
        certificateNumber: 'NABH-2023-CARE'
      }
    ],
    verificationStatus: 'verified',
    isActive: true,
    totalDonationsReceived: 780,
    totalRequestsFulfilled: 620,
    averageRating: 4.1
  },
  {
    name: 'Telangana State Blood Bank',
    type: 'blood_bank',
    registrationNumber: 'TSBB-HYD-006',
    location: {
      type: 'Point',
      coordinates: [78.4867, 17.4065] // Red Hills coordinates
    },
    address: {
      street: 'Red Hills, Lakdikapool',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500004',
      country: 'India'
    },
    contactInfo: {
      phone: '+91-40-23814939',
      email: 'info@tsbloodbank.gov.in',
      website: 'https://www.tsbloodbank.gov.in',
      emergencyContact: '+91-40-23814939'
    },
    operatingHours: {
      monday: { open: '08:00', close: '20:00', is24Hours: false },
      tuesday: { open: '08:00', close: '20:00', is24Hours: false },
      wednesday: { open: '08:00', close: '20:00', is24Hours: false },
      thursday: { open: '08:00', close: '20:00', is24Hours: false },
      friday: { open: '08:00', close: '20:00', is24Hours: false },
      saturday: { open: '08:00', close: '18:00', is24Hours: false },
      sunday: { open: '09:00', close: '17:00', is24Hours: false }
    },
    services: [
      'blood_donation',
      'blood_testing',
      'blood_storage',
      'platelet_donation',
      'plasma_donation',
      'blood_component_separation',
      'cross_matching',
      'blood_screening',
      'mobile_blood_drive'
    ],
    certifications: [
      {
        name: 'Government Blood Bank License',
        issuedBy: 'Drugs Control Administration, Telangana',
        issuedDate: new Date('2023-01-01'),
        expiryDate: new Date('2025-12-31'),
        certificateNumber: 'DCA-TS-2023-001'
      }
    ],
    verificationStatus: 'verified',
    isActive: true,
    totalDonationsReceived: 2150,
    totalRequestsFulfilled: 1890,
    averageRating: 4.0
  },
  {
    name: 'SRL Diagnostics Hyderabad',
    type: 'diagnostic_center',
    registrationNumber: 'SRL-HYD-007',
    location: {
      type: 'Point',
      coordinates: [78.4744, 17.4239] // Somajiguda coordinates
    },
    address: {
      street: '6-3-1090/A/1, Raj Bhavan Road, Somajiguda',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500082',
      country: 'India'
    },
    contactInfo: {
      phone: '+91-40-40206020',
      email: 'hyderabad@srldiagnostics.com',
      website: 'https://www.srldiagnostics.com',
      emergencyContact: '+91-40-40206020'
    },
    operatingHours: {
      monday: { open: '06:00', close: '22:00', is24Hours: false },
      tuesday: { open: '06:00', close: '22:00', is24Hours: false },
      wednesday: { open: '06:00', close: '22:00', is24Hours: false },
      thursday: { open: '06:00', close: '22:00', is24Hours: false },
      friday: { open: '06:00', close: '22:00', is24Hours: false },
      saturday: { open: '06:00', close: '20:00', is24Hours: false },
      sunday: { open: '07:00', close: '18:00', is24Hours: false }
    },
    services: [
      'blood_testing',
      'blood_screening',
      'cross_matching'
    ],
    certifications: [
      {
        name: 'NABL Accreditation',
        issuedBy: 'National Accreditation Board for Testing and Calibration Laboratories',
        issuedDate: new Date('2022-08-15'),
        expiryDate: new Date('2025-08-15'),
        certificateNumber: 'NABL-2022-SRL'
      }
    ],
    verificationStatus: 'verified',
    isActive: true,
    totalDonationsReceived: 0,
    totalRequestsFulfilled: 340,
    averageRating: 4.2
  }
];

// Blood inventory data for hospitals
const generateBloodInventory = () => {
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  return bloodTypes.map(bloodType => {
    const unitsAvailable = Math.floor(Math.random() * 50) + 10; // 10-60 units
    const expirationDates = [];
    
    // Generate 3-5 expiration dates
    for (let i = 0; i < Math.floor(Math.random() * 3) + 3; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 35) + 7); // 7-42 days from now
      expirationDates.push(futureDate);
    }
    
    return {
      bloodType,
      unitsAvailable,
      expirationDates,
      lastUpdated: new Date(),
      minimumThreshold: Math.floor(Math.random() * 10) + 5 // 5-15 units threshold
    };
  });
};

async function seedHospitals() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/bdms';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB for hospital seeding', 'SEED_HOSPITALS');

    // Find or create a default admin user for hospital creation
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      // Create a default admin user for seeding
      adminUser = new User({
        name: 'Hospital Admin',
        phoneNumber: '9988776655',
        email: 'info@callforbloodfoundation.com',
        password: 'hashedpassword', // This would be properly hashed in real scenario
        dateOfBirth: new Date('1985-01-01'),
        gender: 'other',
        bloodType: 'O+',
        weight: 70,
        address: {
          street: 'Admin Address',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500001',
          country: 'India'
        },
        location: {
          type: 'Point',
          coordinates: [78.4867, 17.3850]
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
      logger.info('Created default admin user for hospital seeding', 'SEED_HOSPITALS');
    }

    // Clear existing hospitals
    await Hospital.deleteMany({});
    logger.info('Cleared existing hospitals', 'SEED_HOSPITALS');

    // Seed hospitals
    const hospitalPromises = hyderabadHospitalsData.map(hospitalData => {
      const hospital = new Hospital({
        ...hospitalData,
        adminUser: adminUser._id,
        inventory: generateBloodInventory()
      });
      return hospital.save();
    });

    const createdHospitals = await Promise.all(hospitalPromises);
    logger.success(`Created ${createdHospitals.length} hospitals in Hyderabad`, 'SEED_HOSPITALS');

    logger.success('Hospital seeding completed successfully!', 'SEED_HOSPITALS');
    
    // Display summary
    console.log('\n=== HOSPITAL SEEDING SUMMARY ===');
    console.log(`✅ Hospitals: ${createdHospitals.length} items`);
    console.log(`✅ Blood Banks: ${createdHospitals.filter(h => h.type === 'blood_bank').length} items`);
    console.log(`✅ Diagnostic Centers: ${createdHospitals.filter(h => h.type === 'diagnostic_center').length} items`);
    console.log(`✅ Admin User: ${adminUser.name} (${adminUser.phoneNumber})`);
    console.log('=================================\n');

  } catch (error) {
    logger.error('Error seeding hospitals', 'SEED_HOSPITALS', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB', 'SEED_HOSPITALS');
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedHospitals()
    .then(() => {
      console.log('Hospital seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Hospital seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedHospitals;