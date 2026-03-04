/**
 * Database seeding script for CourseLit
 * This script creates a root organization, domain and super admin user
 */

// Load environment variables from .env files
import { createUser } from "@/server/api/routers/user/helpers";
import { connectToDatabase } from "@workspace/common-logic/lib/db";
import { UIConstants } from "@workspace/common-logic/lib/ui/constants";
import { DomainModel, OrganizationModel } from "@workspace/common-logic/models/organization.model";
import { UserModel } from "@workspace/common-logic/models/user.model";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();


/**
 * Creates or finds the root organization
 */
async function createRootOrganization() {
  console.log("🏢 Creating or finding root organization...");

  const organizationName = "Main Organization";
  let organization = await OrganizationModel.findOne({ slug: "main" });

  if (!organization) {
    console.log(`Creating new organization: ${organizationName}`);

    organization = new OrganizationModel({
      name: organizationName,
      slug: "main",
      description: "Main organization for the platform",
      email: process.env.SUPER_ADMIN_EMAIL || "admin@example.com",
    });

    await organization.save();
    console.log(`✅ Created organization: ${organizationName} with ID: ${organization._id}`);
  } else {
    console.log(
      `✅ Found existing organization: ${organizationName} with ID: ${organization._id}`,
    );
  }

  return organization;
}

/**
 * Creates or finds the root domain
 */
async function createRootDomain(orgId: mongoose.Types.ObjectId) {
  console.log("🌐 Creating or finding root domain...");

  const rootDomainName = "main";
  let domain = await DomainModel.findOne({ name: rootDomainName });

  if (!domain) {
    console.log(`Creating new domain: ${rootDomainName}`);

    domain = new DomainModel({
      orgId: orgId,
      name: rootDomainName,
      siteInfo: {
        title: "My School",
        subtitle: "Welcome to your new learning platform",
        currencyISOCode: "USD",
        paymentMethods: {
          stripe: {
            type: "stripe",
          },
        },
      },
    });

    await domain.save();
    console.log(`✅ Created domain: ${rootDomainName} with ID: ${domain._id}`);
  } else {
    console.log(
      `✅ Found existing domain: ${rootDomainName} with ID: ${domain._id}`,
    );
  }

  return domain;
}

/**
 * Creates or finds the super admin user
 */
async function createSuperAdmin(
  organization: Awaited<ReturnType<typeof createRootOrganization>>,
) {
  console.log("👤 Creating or finding super admin user...");

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminFirebaseUid = process.env.SUPER_ADMIN_FIREBASE_UID;

  if (!superAdminEmail) {
    console.error("❌ SUPER_ADMIN_EMAIL environment variable is required");
    console.log(
      "💡 Please set SUPER_ADMIN_EMAIL=your-email@example.com in your environment",
    );
    process.exit(1);
  }

  console.log(`📧 Using email: ${superAdminEmail}`);

  // Check if super admin already exists
  let existingAdmin = await UserModel.findOne({
    orgId: organization._id,
    email: superAdminEmail.toLowerCase(),
  });

  if (existingAdmin) {
    console.log(`✅ Super admin already exists with ID: ${existingAdmin._id}`);
    console.log(
      `🔑 Current permissions: ${existingAdmin.permissions.join(", ")}`,
    );
    console.log(
      `👥 Current roles: ${existingAdmin.roles?.join(", ") || "None"}`,
    );
    return existingAdmin;
  }

  // Create super admin user
  console.log("👨‍💼 Creating new super admin user...");

  // Prepare provider data if Firebase UID is available
  const providerData = superAdminFirebaseUid
    ? {
      provider: "firebase",
      uid: superAdminFirebaseUid,
      name: process.env.SUPER_ADMIN_NAME || "Super Administrator",
    }
    : undefined;

  const superAdmin = await createUser({
    organization,
    fullName: process.env.SUPER_ADMIN_NAME || "Super Administrator",
    email: superAdminEmail,
    superAdmin: true,
    subscribedToUpdates: true,
    invited: false,
    providerData,
  });

  console.log(`✅ Created super admin user: ${superAdmin.email}`);

  if (providerData) {
    console.log(`🔥 Firebase UID: ${providerData.uid}`);
  }

  return superAdmin;
}

/**
 * Sets all available permissions for the super admin user
 */
async function setAllPermissionsForSuperAdmin(
  superAdmin: Awaited<ReturnType<typeof createSuperAdmin>>,
) {
  console.log("🔐 Setting all permissions for super admin...");

  // Define all available permissions
  const ALL_PERMISSIONS = [
    UIConstants.permissions.manageCourse,
    UIConstants.permissions.manageAnyCourse,
    UIConstants.permissions.publishCourse,
    UIConstants.permissions.enrollInCourse,
    UIConstants.permissions.manageMedia,
    UIConstants.permissions.manageSite,
    UIConstants.permissions.manageSettings,
    UIConstants.permissions.manageUsers,
    UIConstants.permissions.manageCommunity,
  ];

  // Define all available roles
  const ALL_ROLES = [UIConstants.roles.admin, UIConstants.roles.instructor, UIConstants.roles.student];

  // Update user with all permissions and roles
  const updatedUser = await UserModel.findByIdAndUpdate(
    superAdmin._id,
    {
      $set: {
        permissions: ALL_PERMISSIONS,
        roles: ALL_ROLES,
      },
    },
    { new: true },
  );

  if (!updatedUser) {
    throw new Error("Failed to update super admin permissions");
  }

  console.log(
    `✅ Granted all permissions (${updatedUser.permissions.length}) and roles (${updatedUser.roles.length})`,
  );

  return updatedUser;
}

/**
 * Seeds additional default data
 */
async function seedDefaultData(
  organization: Awaited<ReturnType<typeof createRootOrganization>>,
  domain: Awaited<ReturnType<typeof createRootDomain>>,
  superAdmin: Awaited<ReturnType<typeof createSuperAdmin>>,
) {
  console.log("🌱 Seeding default data...");

  // Additional seeding can be done here
  console.log(`✅ Organization ID: ${organization._id}`);
  console.log(`✅ Domain ID: ${domain._id}`);
  console.log(`✅ Super Admin ID: ${superAdmin._id}`);

  console.log("✅ Default data seeding completed");
}

/**
 * Main seeding function
 */
async function seed(): Promise<void> {
  try {
    console.log("🚀 Starting database seeding for CourseLit...");
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🗄️  Database: Using MONGODB_URI from environment`);

    // Connect to database
    await connectToDatabase();
    console.log("✅ Connected to MongoDB successfully");

    // Create root organization
    const organization = await createRootOrganization();

    // Create root domain
    const domain = await createRootDomain(organization._id);

    // Create super admin
    const superAdmin = await createSuperAdmin(organization);

    // Set all permissions for super admin
    const updatedSuperAdmin = await setAllPermissionsForSuperAdmin(superAdmin);

    // Seed default data
    await seedDefaultData(organization, domain, updatedSuperAdmin);

    console.log("\n🎉 Seeding completed!");
    console.log(`🏢 Organization: ${organization.name}`);
    console.log(`🌐 Domain: ${domain.name}`);
    console.log(`👤 Super Admin: ${superAdmin.email}`);
    console.log(`🔐 Permissions: ${updatedSuperAdmin.permissions.length} granted`);
    console.log(`👥 Roles: ${updatedSuperAdmin.roles.length} granted`);
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    if (error instanceof Error && error.stack) {
      console.error("📍 Stack trace:", error.stack);
    }
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("🔌 Database connection closed");
    }
    process.exit(0);
  }
}

seed();
