import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 255, unique: true })
  email: string;

  @Column('varchar', { length: 255 })
  passwordHash: string;

  @Column('varchar', { length: 50 })
  role: 'admin' | 'manager' | 'technician' | 'readonly';

  @Column('varchar', { length: 255, nullable: true })
  firstName: string;

  @Column('varchar', { length: 255, nullable: true })
  lastName: string;

  @Column('boolean', { default: false })
  mfaEnabled: boolean;

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('int', { default: 0 })
  failedLoginAttempts: number;

  @Column('timestamp', { nullable: true })
  lastLoginAt: Date;

  @Column('varchar', { length: 255, nullable: true })
  pinHash: string; // For PIN reveal feature

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('user_mfa')
export class UserMFA {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  userId: string;

  @Column('longtext')
  secretCiphertext: string; // AES encrypted TOTP secret

  @Column('varchar', { length: 255 })
  secretIv: string; // IV for decryption

  @Column('varchar', { length: 255 })
  secretAuthTag: string; // Auth tag for GCM

  @Column('longtext', { nullable: true })
  backupCodeHashes: string; // JSON array of hashed backup codes

  @Column('int', { default: 1 })
  keyVersion: number;

  @Column('boolean', { default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('clients')
export class Client {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 255, nullable: true })
  email: string;

  @Column('varchar', { length: 20, nullable: true })
  phone: string;

  @Column('varchar', { length: 50, default: 'onboarding' })
  status: 'onboarding' | 'operativo' | 'review' | 'rischio';

  @Column('longtext', { nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('sites')
export class Site {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  clientId: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 255, nullable: true })
  address: string;

  @Column('varchar', { length: 255, nullable: true })
  city: string;

  @Column('varchar', { length: 10, nullable: true })
  postalCode: string;

  @Column('varchar', { length: 255, nullable: true })
  country: string;

  @Column('longtext', { nullable: true })
  floorplanUrl: string; // URL to uploaded floorplan image

  @Column('longtext', { nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('devices')
export class Device {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  siteId: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 255, nullable: true })
  brand: string;

  @Column('varchar', { length: 255, nullable: true })
  serial: string;

  @Column('varchar', { length: 50, nullable: true })
  type: string; // server, switch, router, printer, etc.

  @Column('varchar', { length: 15, nullable: true })
  ipLocal: string;

  @Column('varchar', { length: 15, nullable: true })
  ipPublic: string;

  @Column('int', { nullable: true })
  port: number;

  @Column('varchar', { length: 255, nullable: true })
  dns: string;

  @Column('varchar', { length: 36, nullable: true })
  credentialId: string; // Link to credentials

  // Floorplan positioning
  @Column('float', { nullable: true })
  positionX: number;

  @Column('float', { nullable: true })
  positionY: number;

  @Column('float', { default: 0 })
  rotation: number;

  @Column('longtext', { nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('credentials')
export class Credential {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  clientId: string;

  @Column('varchar', { length: 255 })
  title: string;

  @Column('varchar', { length: 255 })
  username: string;

  @Column('longtext')
  passwordCiphertext: string; // AES encrypted password

  @Column('varchar', { length: 255 })
  passwordIv: string;

  @Column('varchar', { length: 255 })
  passwordAuthTag: string;

  @Column('int', { default: 1 })
  keyVersion: number;

  @Column('longtext', { nullable: true })
  notes: string;

  @Column('varchar', { length: 36 })
  lastEditorId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('audit_log')
export class AuditLog {
  @PrimaryColumn('varchar', { length: 100 })
  id: string;

  @Column('timestamp')
  timestamp: Date;

  @Column('varchar', { length: 36 })
  userId: string;

  @Column('varchar', { length: 50 })
  action: string;

  @Column('varchar', { length: 50 })
  resource: string;

  @Column('varchar', { length: 36 })
  resourceId: string;

  @Column('longtext', { nullable: true })
  oldValue: string;

  @Column('longtext', { nullable: true })
  newValue: string;

  @Column('varchar', { length: 15 })
  ipAddress: string;

  @Column('longtext', { nullable: true })
  userAgent: string;

  @Column('varchar', { length: 36 })
  correlationId: string;

  @Column('varchar', { length: 20 })
  status: 'success' | 'failure';

  @Column('longtext', { nullable: true })
  errorMessage: string;

  @Column('varchar', { length: 64 })
  hmacSignature: string; // For non-repudiation

  // Index for queries
  static INDEX_TIMESTAMP = 'idx_timestamp';
  static INDEX_USER_ID = 'idx_user_id';
  static INDEX_RESOURCE = 'idx_resource';
}
