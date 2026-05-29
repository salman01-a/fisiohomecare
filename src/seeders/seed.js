/**
 * Database seeder — creates initial admin user and sample data
 * Run: node src/seeders/seed.js
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, User, Patient, Therapist, Schedule, Service } = require('../models');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync tables
    await sequelize.sync({ force: true });
    console.log('✅ Tables recreated');

    // 1. Admin user
    const admin = await User.create({
      name: 'Admin Klinik',
      email: 'admin@fisiohomecare.com',
      phone: '081234567890',
      role: 'admin',
      password_hash: await bcrypt.hash('admin123', 10),
    });
    console.log('👤 Admin created:', admin.email);

    // 2. Therapist user + profile
    const therapistUser = await User.create({
      name: 'Dr. Budi Fisioterapis',
      email: 'budi@fisiohomecare.com',
      phone: '081234567891',
      role: 'therapist',
      password_hash: await bcrypt.hash('therapist123', 10),
    });
    const therapist = await Therapist.create({
      user_id: therapistUser.id,
      license_number: 'STR-FIS-2024-001',
      specialization: 'Ortopedi',
      status: 'active',
      validated_by: admin.id,
      validated_at: new Date(),
      rating: 4.8,
    });
    console.log('👨‍⚕️ Therapist created:', therapistUser.email);

    // 3. Patient user + profile
    const patientUser = await User.create({
      name: 'Andi Pasien',
      email: 'andi@gmail.com',
      phone: '081234567892',
      role: 'patient',
      password_hash: await bcrypt.hash('patient123', 10),
    });
    await Patient.create({
      user_id: patientUser.id,
      address: 'Jl. Merdeka No. 10, Jakarta',
      medical_history: 'Pasca operasi ACL lutut kanan',
      emergency_contact: '081234567800',
      dob: '1990-05-15',
    });
    console.log('🧑 Patient created:', patientUser.email);

    // 4. Sample services (layanan)
    const services = await Service.bulkCreate([
      { name: 'Fisioterapi Pasca Operasi', description: 'Rehabilitasi dan pemulihan pasca tindakan operasi', price: 350000, duration_minutes: 60 },
      { name: 'Fisioterapi Ortopedi', description: 'Terapi untuk masalah tulang, sendi, dan otot', price: 300000, duration_minutes: 60 },
      { name: 'Fisioterapi Neurologi', description: 'Terapi untuk gangguan saraf (stroke, cedera saraf)', price: 400000, duration_minutes: 90 },
      { name: 'Fisioterapi Geriatri', description: 'Terapi khusus untuk lansia', price: 300000, duration_minutes: 60 },
      { name: 'Fisioterapi Pediatri', description: 'Terapi untuk anak-anak dengan keterlambatan motorik', price: 350000, duration_minutes: 45 },
    ]);
    console.log(`💊 ${services.length} services created`);

    // 5. Sample schedules
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);

    const formatDate = (d) => d.toISOString().split('T')[0];

    const schedules = await Schedule.bulkCreate([
      { therapist_id: therapist.id, date: formatDate(tomorrow), start_time: '08:00', end_time: '09:00' },
      { therapist_id: therapist.id, date: formatDate(tomorrow), start_time: '09:00', end_time: '10:00' },
      { therapist_id: therapist.id, date: formatDate(tomorrow), start_time: '10:00', end_time: '11:00' },
      { therapist_id: therapist.id, date: formatDate(dayAfter), start_time: '08:00', end_time: '09:00' },
      { therapist_id: therapist.id, date: formatDate(dayAfter), start_time: '14:00', end_time: '15:00' },
    ]);
    console.log(`📅 ${schedules.length} schedules created`);

    console.log('\n✅ Seeding complete!');
    console.log('\n📋 Login credentials:');
    console.log('   Admin:     admin@fisiohomecare.com / admin123');
    console.log('   Therapist: budi@fisiohomecare.com / therapist123');
    console.log('   Patient:   andi@gmail.com / patient123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();
