# MedConnect Database Setup Guide

## Database Configuration
- **Database Type:** MariaDB/MySQL
- **Database Name:** medconnect
- **Host:** localhost
- **Port:** 3306

## Database Tables Structure

### 1. Django Built-in Tables

#### auth_user (User Accounts)
```sql
CREATE TABLE auth_user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    password VARCHAR(128) NOT NULL,
    last_login DATETIME NULL,
    is_superuser TINYINT(1) NOT NULL,
    username VARCHAR(150) UNIQUE NOT NULL,
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    is_staff TINYINT(1) NOT NULL,
    is_active TINYINT(1) NOT NULL,
    date_joined DATETIME NOT NULL
);
```

#### auth_group (User Groups)
```sql
CREATE TABLE auth_group (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL
);
```

#### auth_permission (Permissions)
```sql
CREATE TABLE auth_permission (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content_type_id INT NOT NULL,
    codename VARCHAR(100) NOT NULL
);
```

#### django_content_type (Content Types)
```sql
CREATE TABLE django_content_type (
    id INT AUTO_INCREMENT PRIMARY KEY,
    app_label VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL
);
```

#### django_session (User Sessions)
```sql
CREATE TABLE django_session (
    session_key VARCHAR(40) PRIMARY KEY,
    session_data LONGTEXT NOT NULL,
    expire_date DATETIME NOT NULL
);
```

#### django_admin_log (Admin Actions)
```sql
CREATE TABLE django_admin_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action_time DATETIME NOT NULL,
    object_id LONGTEXT NULL,
    object_repr VARCHAR(200) NOT NULL,
    action_flag SMALLINT NOT NULL,
    change_message LONGTEXT NOT NULL,
    content_type_id INT NULL,
    user_id INT NOT NULL
);
```

### 2. MedConnect App Tables

#### medconnect_app_researcher (Researcher Profiles)
```sql
CREATE TABLE medconnect_app_researcher (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    research_area VARCHAR(50) NOT NULL,
    institution VARCHAR(200) NOT NULL,
    qualification VARCHAR(100) NOT NULL,
    research_experience_years INT NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    address LONGTEXT NOT NULL,
    is_available TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES auth_user(id)
);
```

#### medconnect_app_patient (Patient Profiles)
```sql
CREATE TABLE medconnect_app_patient (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    date_of_birth DATE NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    address LONGTEXT NOT NULL,
    emergency_contact VARCHAR(15) NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES auth_user(id)
);
```

#### medconnect_app_researchstudy (Research Studies)
```sql
CREATE TABLE medconnect_app_researchstudy (
    id INT AUTO_INCREMENT PRIMARY KEY,
    researcher_id INT NOT NULL,
    patient_id INT NOT NULL,
    study_title VARCHAR(200) NOT NULL,
    study_description LONGTEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'recruiting',
    start_date DATE NOT NULL,
    end_date DATE NULL,
    compensation VARCHAR(100) NOT NULL,
    requirements LONGTEXT NOT NULL,
    notes LONGTEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (researcher_id) REFERENCES medconnect_app_researcher(id),
    FOREIGN KEY (patient_id) REFERENCES medconnect_app_patient(id)
);
```

## Research Area Choices
- clinical_research
- biomedical_research
- pharmaceutical_research
- genetics_research
- epidemiology
- public_health
- medical_devices
- other

## Study Status Choices
- recruiting
- in_progress
- completed
- cancelled

## Database Setup Commands

### 1. Create Database
```sql
CREATE DATABASE medconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Create User (Optional)
```sql
CREATE USER 'medconnect_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON medconnect.* TO 'medconnect_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Django Commands
```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Check database
python manage.py dbshell
```

## Sample Data Queries

### View All Researchers
```sql
SELECT 
    u.first_name, 
    u.last_name, 
    u.email, 
    r.research_area, 
    r.institution, 
    r.qualification
FROM auth_user u
JOIN medconnect_app_researcher r ON u.id = r.user_id;
```

### View All Patients
```sql
SELECT 
    u.first_name, 
    u.last_name, 
    u.email, 
    p.date_of_birth, 
    p.blood_group
FROM auth_user u
JOIN medconnect_app_patient p ON u.id = p.user_id;
```

### View Research Studies
```sql
SELECT 
    rs.study_title,
    rs.status,
    rs.start_date,
    CONCAT(ru.first_name, ' ', ru.last_name) as researcher_name,
    CONCAT(pu.first_name, ' ', pu.last_name) as patient_name
FROM medconnect_app_researchstudy rs
JOIN medconnect_app_researcher r ON rs.researcher_id = r.id
JOIN auth_user ru ON r.user_id = ru.id
JOIN medconnect_app_patient p ON rs.patient_id = p.id
JOIN auth_user pu ON p.user_id = pu.id;
``` 