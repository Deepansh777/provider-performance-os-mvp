-- vbp performance os mvp postgres schema + seed data
-- reporting period: dec-25 report | rolling 12: jan-25 through dec-25
-- all data is synthetic demo data. no real phi.

DROP TABLE IF EXISTS outreach_log CASCADE;
DROP TABLE IF EXISTS action_tasks CASCADE;
DROP TABLE IF EXISTS cost_cap_member_detail CASCADE;
DROP TABLE IF EXISTS cost_cap_summary CASCADE;
DROP TABLE IF EXISTS specialist_performance CASCADE;
DROP TABLE IF EXISTS referral_events CASCADE;
DROP TABLE IF EXISTS specialists CASCADE;
DROP TABLE IF EXISTS hospital_events CASCADE;
DROP TABLE IF EXISTS access_events CASCADE;
DROP TABLE IF EXISTS care_gaps CASCADE;
DROP TABLE IF EXISTS cost_summary CASCADE;
DROP TABLE IF EXISTS member_risk_monthly CASCADE;
DROP TABLE IF EXISTS member_conditions CASCADE;
DROP TABLE IF EXISTS benchmarks CASCADE;
DROP TABLE IF EXISTS domain_scores CASCADE;
DROP TABLE IF EXISTS provider_metric_results CASCADE;
DROP TABLE IF EXISTS metric_definitions CASCADE;
DROP TABLE IF EXISTS vbp_domains CASCADE;
DROP TABLE IF EXISTS member_attribution CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS version_log CASCADE;
DROP TABLE IF EXISTS data_refresh_log CASCADE;

CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    organization_name TEXT NOT NULL,
    organization_type TEXT NOT NULL,
    market TEXT NOT NULL,
    state TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE providers (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id),
    provider_name TEXT NOT NULL,
    provider_type TEXT NOT NULL,
    npi TEXT,
    tin TEXT,
    region TEXT,
    specialty TEXT,
    active_flag BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    active_flag BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id),
    contract_name TEXT NOT NULL,
    payer_name TEXT NOT NULL,
    product_line TEXT NOT NULL,
    contract_year INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_available_pool NUMERIC(14,2) NOT NULL,
    status TEXT NOT NULL
);

CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id),
    member_external_id TEXT UNIQUE NOT NULL,
    member_name TEXT NOT NULL,
    dob DATE NOT NULL,
    gender TEXT NOT NULL,
    risk_score NUMERIC(5,2) NOT NULL,
    primary_provider_id INT REFERENCES providers(id),
    active_flag BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE member_attribution (
    id SERIAL PRIMARY KEY,
    member_id INT NOT NULL REFERENCES members(id),
    provider_id INT NOT NULL REFERENCES providers(id),
    contract_id INT NOT NULL REFERENCES contracts(id),
    attribution_month DATE NOT NULL,
    attribution_start_date DATE NOT NULL,
    attribution_end_date DATE,
    attribution_status TEXT NOT NULL
);

CREATE TABLE vbp_domains (
    id SERIAL PRIMARY KEY,
    contract_id INT NOT NULL REFERENCES contracts(id),
    domain_name TEXT NOT NULL,
    domain_weight NUMERIC(5,2) NOT NULL,
    available_amount NUMERIC(14,2) NOT NULL,
    sort_order INT NOT NULL
);

CREATE TABLE metric_definitions (
    id SERIAL PRIMARY KEY,
    metric_name TEXT UNIQUE NOT NULL,
    metric_display_name TEXT NOT NULL,
    domain_name TEXT NOT NULL,
    metric_category TEXT NOT NULL,
    unit_type TEXT NOT NULL,
    direction TEXT NOT NULL,
    numerator_definition TEXT,
    denominator_definition TEXT,
    calculation_notes TEXT,
    active_flag BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE provider_metric_results (
    id SERIAL PRIMARY KEY,
    provider_id INT NOT NULL REFERENCES providers(id),
    contract_id INT NOT NULL REFERENCES contracts(id),
    metric_definition_id INT NOT NULL REFERENCES metric_definitions(id),
    reporting_period DATE NOT NULL,
    measurement_window TEXT NOT NULL,
    metric_value NUMERIC(14,4) NOT NULL,
    prior_period_value NUMERIC(14,4),
    benchmark_value NUMERIC(14,4),
    vs_benchmark NUMERIC(14,4),
    percentile INT,
    status TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE domain_scores (
    id SERIAL PRIMARY KEY,
    provider_id INT NOT NULL REFERENCES providers(id),
    contract_id INT NOT NULL REFERENCES contracts(id),
    domain_id INT NOT NULL REFERENCES vbp_domains(id),
    reporting_period DATE NOT NULL,
    measurement_window TEXT NOT NULL,
    r12_score NUMERIC(6,2) NOT NULL,
    benchmark_score NUMERIC(6,2) NOT NULL,
    vs_benchmark NUMERIC(6,2) NOT NULL,
    available_amount NUMERIC(14,2) NOT NULL,
    earned_amount NUMERIC(14,2) NOT NULL,
    missed_amount NUMERIC(14,2) NOT NULL,
    capture_rate NUMERIC(6,2) NOT NULL
);

CREATE TABLE benchmarks (
    id SERIAL PRIMARY KEY,
    contract_id INT NOT NULL REFERENCES contracts(id),
    metric_definition_id INT NOT NULL REFERENCES metric_definitions(id),
    benchmark_period TEXT NOT NULL,
    network_avg NUMERIC(14,4) NOT NULL,
    percentile_25 NUMERIC(14,4),
    median NUMERIC(14,4),
    percentile_75 NUMERIC(14,4),
    top_decile NUMERIC(14,4),
    direction TEXT NOT NULL,
    source_notes TEXT,
    effective_start_date DATE NOT NULL,
    effective_end_date DATE
);

CREATE TABLE member_conditions (
    id SERIAL PRIMARY KEY,
    member_id INT NOT NULL REFERENCES members(id),
    condition_name TEXT NOT NULL,
    condition_category TEXT NOT NULL,
    diagnosis_date DATE,
    active_flag BOOLEAN NOT NULL DEFAULT TRUE,
    controlled_flag BOOLEAN,
    last_measured_date DATE
);

CREATE TABLE member_risk_monthly (
    id SERIAL PRIMARY KEY,
    member_id INT NOT NULL REFERENCES members(id),
    reporting_month DATE NOT NULL,
    risk_score NUMERIC(5,2) NOT NULL,
    risk_tier TEXT NOT NULL,
    predicted_admit_probability NUMERIC(6,2) NOT NULL,
    avg_cost_pmpm NUMERIC(14,2) NOT NULL,
    care_management_recommended_flag BOOLEAN NOT NULL
);

CREATE TABLE cost_summary (
    id SERIAL PRIMARY KEY,
    provider_id INT NOT NULL REFERENCES providers(id),
    contract_id INT NOT NULL REFERENCES contracts(id),
    reporting_period DATE NOT NULL,
    measurement_window TEXT NOT NULL,
    cost_category TEXT NOT NULL,
    total_cost NUMERIC(14,2) NOT NULL,
    pmpm NUMERIC(14,2) NOT NULL,
    yoy_delta_pmpm NUMERIC(14,2),
    yoy_delta_percent NUMERIC(8,2),
    percent_of_total_cost NUMERIC(8,2)
);

CREATE TABLE care_gaps (
    id SERIAL PRIMARY KEY,
    member_id INT NOT NULL REFERENCES members(id),
    provider_id INT NOT NULL REFERENCES providers(id),
    contract_id INT NOT NULL REFERENCES contracts(id),
    measure_name TEXT NOT NULL,
    gap_status TEXT NOT NULL,
    eligible_flag BOOLEAN NOT NULL DEFAULT TRUE,
    gap_open_date DATE,
    gap_close_date DATE,
    estimated_dollar_impact NUMERIC(12,2),
    priority_flag TEXT NOT NULL
);

CREATE TABLE access_events (
    id SERIAL PRIMARY KEY,
    provider_id INT NOT NULL REFERENCES providers(id),
    member_id INT REFERENCES members(id),
    event_date DATE NOT NULL,
    event_type TEXT NOT NULL,
    appointment_wait_days NUMERIC(6,2),
    visit_completed_flag BOOLEAN NOT NULL,
    source_system TEXT NOT NULL
);

CREATE TABLE hospital_events (
    id SERIAL PRIMARY KEY,
    member_id INT NOT NULL REFERENCES members(id),
    provider_id INT NOT NULL REFERENCES providers(id),
    contract_id INT NOT NULL REFERENCES contracts(id),
    event_type TEXT NOT NULL,
    admit_date DATE NOT NULL,
    discharge_date DATE,
    facility_name TEXT NOT NULL,
    primary_dx TEXT,
    drg TEXT,
    los_days INT,
    allowed_cost NUMERIC(14,2) NOT NULL,
    avoidable_er_flag BOOLEAN DEFAULT FALSE,
    readmission_flag BOOLEAN DEFAULT FALSE,
    readmission_risk TEXT,
    tcm_referral_sent_flag BOOLEAN DEFAULT FALSE,
    care_management_enrolled_flag BOOLEAN DEFAULT FALSE
);

CREATE TABLE specialists (
    id SERIAL PRIMARY KEY,
    specialist_name TEXT NOT NULL,
    npi TEXT,
    specialty TEXT NOT NULL,
    group_name TEXT NOT NULL,
    network_status TEXT NOT NULL,
    market TEXT NOT NULL,
    state TEXT NOT NULL
);

CREATE TABLE referral_events (
    id SERIAL PRIMARY KEY,
    member_id INT NOT NULL REFERENCES members(id),
    referring_provider_id INT NOT NULL REFERENCES providers(id),
    specialist_provider_id INT NOT NULL REFERENCES specialists(id),
    contract_id INT NOT NULL REFERENCES contracts(id),
    referral_date DATE NOT NULL,
    specialty TEXT NOT NULL,
    inn_oon_flag TEXT NOT NULL,
    referral_reason TEXT,
    allowed_cost NUMERIC(14,2) NOT NULL,
    imaging_cost NUMERIC(14,2) DEFAULT 0,
    lab_diagnostic_cost NUMERIC(14,2) DEFAULT 0,
    steerage_opportunity_flag BOOLEAN DEFAULT FALSE
);

CREATE TABLE specialist_performance (
    id SERIAL PRIMARY KEY,
    specialist_id INT NOT NULL REFERENCES specialists(id),
    contract_id INT NOT NULL REFERENCES contracts(id),
    reporting_period DATE NOT NULL,
    r12_referrals INT NOT NULL,
    unique_members INT NOT NULL,
    r12_total_cost NUMERIC(14,2) NOT NULL,
    avg_cost_per_visit NUMERIC(14,2) NOT NULL,
    specialty_peer_avg_cost NUMERIC(14,2) NOT NULL,
    vs_peer_amount NUMERIC(14,2) NOT NULL,
    vs_peer_percent NUMERIC(8,2) NOT NULL,
    outlier_flag TEXT NOT NULL,
    steerage_opportunity TEXT NOT NULL
);

CREATE TABLE cost_cap_summary (
    id SERIAL PRIMARY KEY,
    provider_id INT NOT NULL REFERENCES providers(id),
    contract_id INT NOT NULL REFERENCES contracts(id),
    reporting_period DATE NOT NULL,
    measurement_window TEXT NOT NULL,
    cost_cap_threshold NUMERIC(14,2) NOT NULL,
    members_with_capped_costs INT NOT NULL,
    total_actual_allowed_cost_capped_members NUMERIC(14,2) NOT NULL,
    total_cap_amount_applied NUMERIC(14,2) NOT NULL,
    total_dollars_excluded NUMERIC(14,2) NOT NULL,
    uncapped_panel_pmpm NUMERIC(14,2) NOT NULL,
    capped_panel_pmpm NUMERIC(14,2) NOT NULL,
    pmpm_impact NUMERIC(14,2) NOT NULL,
    domains_affected TEXT NOT NULL
);

CREATE TABLE cost_cap_member_detail (
    id SERIAL PRIMARY KEY,
    member_id INT NOT NULL REFERENCES members(id),
    provider_id INT NOT NULL REFERENCES providers(id),
    contract_id INT NOT NULL REFERENCES contracts(id),
    reporting_period DATE NOT NULL,
    r12_actual_allowed_cost NUMERIC(14,2) NOT NULL,
    cap_threshold NUMERIC(14,2) NOT NULL,
    cap_applied_flag BOOLEAN NOT NULL,
    amount_excluded NUMERIC(14,2) NOT NULL,
    hospital_cost_excluded NUMERIC(14,2) NOT NULL,
    referral_cost_excluded NUMERIC(14,2) NOT NULL,
    months_in_r12_window INT NOT NULL,
    care_management_enrolled_flag BOOLEAN NOT NULL,
    notes TEXT
);

CREATE TABLE action_tasks (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id),
    provider_id INT REFERENCES providers(id),
    member_id INT REFERENCES members(id),
    task_type TEXT NOT NULL,
    priority TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    recommended_action TEXT NOT NULL,
    estimated_dollar_impact NUMERIC(12,2),
    assigned_to INT REFERENCES users(id),
    status TEXT NOT NULL,
    due_date DATE,
    completed_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE outreach_log (
    id SERIAL PRIMARY KEY,
    task_id INT NOT NULL REFERENCES action_tasks(id),
    member_id INT REFERENCES members(id),
    outreach_date DATE NOT NULL,
    outreach_method TEXT NOT NULL,
    outcome TEXT NOT NULL,
    next_step TEXT,
    staff_name TEXT NOT NULL
);

CREATE TABLE version_log (
    id SERIAL PRIMARY KEY,
    version TEXT NOT NULL,
    release_date DATE NOT NULL,
    change_type TEXT NOT NULL,
    module_name TEXT NOT NULL,
    summary TEXT NOT NULL,
    before_value TEXT,
    after_value TEXT,
    changed_by TEXT,
    approved_by TEXT,
    user_impact TEXT
);

CREATE TABLE data_refresh_log (
    id SERIAL PRIMARY KEY,
    refresh_date DATE NOT NULL,
    data_source TEXT NOT NULL,
    period_loaded TEXT NOT NULL,
    records_processed INT NOT NULL,
    status TEXT NOT NULL,
    validation_result TEXT NOT NULL,
    notes TEXT
);

-- organizations / provider groups: fake but wichita ks realistic
INSERT INTO organizations (organization_name, organization_type, market, state) VALUES
('Ark Valley Primary Care Partners', 'Provider Group', 'Wichita', 'KS'),
('Prairie Health Family Physicians', 'Provider Group', 'Wichita', 'KS'),
('ICT Community Care Network', 'ACO', 'Wichita', 'KS'),
('Riverside Medical Group of Wichita', 'Provider Group', 'Wichita', 'KS'),
('Air Capital Physician Alliance', 'ACO', 'Wichita', 'KS');

INSERT INTO providers (organization_id, provider_name, provider_type, npi, tin, region, specialty) VALUES
(1, 'Ark Valley Primary Care Partners', 'group', '1734567801', '48-2100011', 'Wichita Northeast', 'Primary Care'),
(2, 'Prairie Health Family Physicians', 'group', '1734567802', '48-2100012', 'Wichita West', 'Family Medicine'),
(3, 'ICT Community Care Network', 'group', '1734567803', '48-2100013', 'Wichita Central', 'Primary Care'),
(4, 'Riverside Medical Group of Wichita', 'group', '1734567804', '48-2100014', 'Wichita Riverside', 'Internal Medicine'),
(5, 'Air Capital Physician Alliance', 'group', '1734567805', '48-2100015', 'Wichita South', 'Primary Care');

-- 12 users. group 1 has 3 users, group 2 has 1 user, group 3 has 2, group 4 has 3, group 5 has 3.
INSERT INTO users (organization_id, email, full_name, role) VALUES
(1, 'maya.patel@arkvalleypcp.com', 'Maya Patel', 'executive'),
(1, 'grant.miller@arkvalleypcp.com', 'Grant Miller', 'analyst'),
(1, 'lena.owens@arkvalleypcp.com', 'Lena Owens', 'care_manager'),
(2, 'eric.hamilton@prairiehealthfp.com', 'Eric Hamilton', 'admin'),
(3, 'sarah.chen@ictcareaco.org', 'Sarah Chen', 'executive'),
(3, 'darius.reed@ictcareaco.org', 'Darius Reed', 'care_manager'),
(4, 'olivia.brooks@riversidemedwichita.com', 'Olivia Brooks', 'executive'),
(4, 'nathan.young@riversidemedwichita.com', 'Nathan Young', 'analyst'),
(4, 'amanda.lopez@riversidemedwichita.com', 'Amanda Lopez', 'care_manager'),
(5, 'victor.nguyen@aircapitalphysicians.com', 'Victor Nguyen', 'executive'),
(5, 'keisha.martin@aircapitalphysicians.com', 'Keisha Martin', 'analyst'),
(5, 'tom.bennett@aircapitalphysicians.com', 'Tom Bennett', 'care_manager');

-- System admin user (NULL organization_id to access all organizations)
INSERT INTO users (organization_id, email, full_name, role) VALUES
(NULL, 'deepansh.arora@demoadmin.com', 'Deepansh Arora', 'admin');

INSERT INTO contracts (organization_id, contract_name, payer_name, product_line, contract_year, start_date, end_date, total_available_pool, status) VALUES
(1, 'Wichita VBP Shared Savings 2025', 'Sunflower Health Advantage', 'Medicare Advantage', 2025, '2025-01-01', '2025-12-31', 500000, 'active'),
(2, 'Wichita VBP Shared Savings 2025', 'Sunflower Health Advantage', 'Medicare Advantage', 2025, '2025-01-01', '2025-12-31', 360000, 'active'),
(3, 'Wichita VBP Shared Savings 2025', 'Sunflower Health Advantage', 'Medicare Advantage', 2025, '2025-01-01', '2025-12-31', 620000, 'active'),
(4, 'Wichita VBP Shared Savings 2025', 'Sunflower Health Advantage', 'Medicare Advantage', 2025, '2025-01-01', '2025-12-31', 480000, 'active'),
(5, 'Wichita VBP Shared Savings 2025', 'Sunflower Health Advantage', 'Medicare Advantage', 2025, '2025-01-01', '2025-12-31', 720000, 'active');

-- domains per contract
INSERT INTO vbp_domains (contract_id, domain_name, domain_weight, available_amount, sort_order)
SELECT c.id, d.domain_name, d.domain_weight, ROUND(c.total_available_pool * d.domain_weight / 100.0, 2), d.sort_order
FROM contracts c
CROSS JOIN (VALUES
('Access & Timeliness', 10.00, 1),
('Quality / Care Gaps', 10.00, 2),
('Hospital Costs', 40.00, 3),
('Referral & Specialty Costs', 40.00, 4)
) AS d(domain_name, domain_weight, sort_order);

INSERT INTO metric_definitions (metric_name, metric_display_name, domain_name, metric_category, unit_type, direction, numerator_definition, denominator_definition, calculation_notes) VALUES
('total_available_pool_r12', 'Total Available Pool — R12 ($)', 'Executive', 'financial', '$', 'higher_better', 'Contracted available incentive dollars', 'N/A', 'Annual available VBP incentive pool.'),
('total_earned_r12', 'Total Earned — R12 ($)', 'Executive', 'financial', '$', 'higher_better', 'Earned incentive dollars', 'Available incentive dollars', 'Calculated from domain capture.'),
('missed_opportunity_r12', 'Missed Opportunity — R12 ($)', 'Executive', 'financial', '$', 'lower_better', 'Available minus earned dollars', 'N/A', 'Dollarized improvement opportunity.'),
('overall_capture_rate_r12', 'Overall Capture Rate — R12 (%)', 'Executive', 'financial', '%', 'higher_better', 'Earned dollars', 'Available dollars', 'Earned / available.'),
('total_cost_pmpm', 'Total Cost PMPM ($)', 'Executive', 'cost', 'PMPM', 'lower_better', 'Total allowed cost', 'Member months', 'Cost per member per month.'),
('admissions_per_1000', 'Admissions / 1,000', 'Hospital Costs', 'utilization', '/1000', 'lower_better', 'Inpatient admissions annualized', 'Attributed members', 'R12 annualized.'),
('er_visits_per_1000', 'ER Visits / 1,000', 'Hospital Costs', 'utilization', '/1000', 'lower_better', 'ER visits annualized', 'Attributed members', 'R12 annualized.'),
('readmission_rate_30d', '30-Day Readmission Rate (%)', 'Hospital Costs', 'utilization', '%', 'lower_better', 'Readmissions within 30 days', 'Index admissions', 'R12.'),
('quality_score_r12', 'Quality Score (R12 composite)', 'Quality / Care Gaps', 'score', 'score', 'higher_better', 'Weighted quality points', 'Eligible points', 'Composite score 0-100.'),
('access_score', 'Access Score (composite, 0–100)', 'Access & Timeliness', 'score', 'score', 'higher_better', 'Weighted access points', 'Eligible access points', 'Composite score 0-100.'),
('referral_rate_100_pcp', 'Referral Rate per 100 PCP Visits', 'Referral & Specialty Costs', 'utilization', '/100', 'lower_better', 'Specialty referrals', 'PCP visits', 'R12.'),
('awv_completion_rate', 'AWV Completion Rate (%)', 'Access & Timeliness', 'quality', '%', 'higher_better', 'Completed AWVs', 'Eligible members', 'R12.'),
('pcp_days_next_available', 'PCP Days to Next Available Appointment', 'Access & Timeliness', 'access', 'days', 'lower_better', 'Days to next PCP slot', 'N/A', 'Lower means better access.'),
('telehealth_utilization_rate', 'Telehealth Utilization Rate (%)', 'Access & Timeliness', 'access', '%', 'higher_better', 'Telehealth visits', 'Total visits', 'R12.'),
('a1c_control_rate', 'Diabetes: A1c Control (<8%) Rate', 'Quality / Care Gaps', 'quality', '%', 'higher_better', 'Diabetic members with A1c <8', 'Eligible diabetic members', 'R12.'),
('bp_control_rate', 'Hypertension: BP Control Rate', 'Quality / Care Gaps', 'quality', '%', 'higher_better', 'Controlled BP members', 'Eligible hypertension members', 'R12.'),
('total_inpatient_cost_pmpm', 'Total Inpatient Cost PMPM ($)', 'Hospital Costs', 'cost', 'PMPM', 'lower_better', 'Inpatient allowed cost', 'Member months', 'R12.'),
('avoidable_er_rate', 'Avoidable / Low-Acuity ER Rate (%)', 'Hospital Costs', 'utilization', '%', 'lower_better', 'Avoidable ER visits', 'Total ER visits', 'R12.'),
('avg_cost_per_admission', 'Average Cost per Admission ($)', 'Hospital Costs', 'cost', '$', 'lower_better', 'Total inpatient cost', 'Total admissions', 'R12.'),
('observation_stays_per_1000', 'Observation Stays / 1,000', 'Hospital Costs', 'utilization', '/1000', 'lower_better', 'Observation stays annualized', 'Attributed members', 'R12 annualized.'),
('snf_post_acute_cost_pmpm', 'SNF / Post-Acute Cost PMPM ($)', 'Hospital Costs', 'cost', 'PMPM', 'lower_better', 'SNF and post-acute facility cost', 'Member months', 'R12.'),
('hospital_cost_score', 'Hospital Cost Score (0-100)', 'Hospital Costs', 'score', 'score', 'higher_better', 'Composite hospital cost performance', 'N/A', 'Composite score 0-100, higher means better cost control.'),
('total_referral_specialty_pmpm', 'Total Referral & Specialty PMPM ($)', 'Referral & Specialty Costs', 'cost', 'PMPM', 'lower_better', 'Referral and specialty cost', 'Member months', 'R12.'),
('oon_referral_rate', 'Out-of-Network Referral Rate (%)', 'Referral & Specialty Costs', 'utilization', '%', 'lower_better', 'OON referrals', 'All referrals', 'R12.');

-- benchmark values for each contract using same network assumptions
INSERT INTO benchmarks (contract_id, metric_definition_id, benchmark_period, network_avg, percentile_25, median, percentile_75, top_decile, direction, source_notes, effective_start_date, effective_end_date)
SELECT c.id, md.id, '2025 R12',
CASE md.metric_name
WHEN 'total_cost_pmpm' THEN 520 WHEN 'admissions_per_1000' THEN 225 WHEN 'er_visits_per_1000' THEN 295 WHEN 'readmission_rate_30d' THEN 13.5
WHEN 'quality_score_r12' THEN 78 WHEN 'access_score' THEN 75 WHEN 'referral_rate_100_pcp' THEN 25 WHEN 'awv_completion_rate' THEN 70
WHEN 'pcp_days_next_available' THEN 7 WHEN 'telehealth_utilization_rate' THEN 22 WHEN 'a1c_control_rate' THEN 70 WHEN 'bp_control_rate' THEN 74
WHEN 'total_inpatient_cost_pmpm' THEN 88.5 WHEN 'avoidable_er_rate' THEN 22 WHEN 'total_referral_specialty_pmpm' THEN 132 WHEN 'oon_referral_rate' THEN 8
ELSE 0 END,
NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC,
md.direction, 'Synthetic 2025 Wichita network benchmark', '2025-01-01', '2025-12-31'
FROM contracts c
JOIN metric_definitions md ON md.metric_name IN (
'total_cost_pmpm','admissions_per_1000','er_visits_per_1000','readmission_rate_30d','quality_score_r12','access_score','referral_rate_100_pcp','awv_completion_rate','pcp_days_next_available','telehealth_utilization_rate','a1c_control_rate','bp_control_rate','total_inpatient_cost_pmpm','avoidable_er_rate','total_referral_specialty_pmpm','oon_referral_rate');

-- provider metric results: numbers tell different performance stories
WITH vals(provider_id, contract_id, metric_name, metric_value, prior_value, benchmark_value, percentile, status) AS (VALUES
-- group 1: strong overall, excellent quality and cost
(1,1,'total_cost_pmpm',486,505,520,78,'above'),(1,1,'admissions_per_1000',198,214,225,80,'above'),(1,1,'er_visits_per_1000',272,288,295,74,'above'),(1,1,'readmission_rate_30d',11.8,12.6,13.5,82,'above'),(1,1,'quality_score_r12',86,82,78,88,'above'),(1,1,'access_score',81,77,75,84,'above'),(1,1,'referral_rate_100_pcp',22.1,23.9,25,76,'above'),(1,1,'awv_completion_rate',76.5,71.2,70,82,'above'),(1,1,'pcp_days_next_available',5.4,6.2,7,84,'above'),(1,1,'telehealth_utilization_rate',24.8,22.1,22,76,'above'),(1,1,'a1c_control_rate',73.2,69.8,70,75,'above'),(1,1,'bp_control_rate',78.4,75.0,74,80,'above'),(1,1,'total_inpatient_cost_pmpm',78.6,84.2,88.5,83,'above'),(1,1,'avoidable_er_rate',18.7,21.4,22,79,'above'),(1,1,'total_referral_specialty_pmpm',119.4,126.1,132,81,'above'),(1,1,'oon_referral_rate',5.4,6.8,8,80,'above'),
-- group 2: access and quality weakness, cost okay
(2,2,'total_cost_pmpm',515,508,520,55,'at'),(2,2,'admissions_per_1000',220,218,225,54,'at'),(2,2,'er_visits_per_1000',304,292,295,42,'below'),(2,2,'readmission_rate_30d',13.7,13.2,13.5,45,'below'),(2,2,'quality_score_r12',71,73,78,33,'below'),(2,2,'access_score',63,66,75,25,'below'),(2,2,'referral_rate_100_pcp',24.4,24.9,25,56,'at'),(2,2,'awv_completion_rate',58.1,60.5,70,22,'below'),(2,2,'pcp_days_next_available',10.6,9.8,7,18,'below'),(2,2,'telehealth_utilization_rate',14.2,15.1,22,20,'below'),(2,2,'a1c_control_rate',63.5,64.8,70,30,'below'),(2,2,'bp_control_rate',68.2,69.9,74,32,'below'),(2,2,'total_inpatient_cost_pmpm',89.8,86.4,88.5,48,'below'),(2,2,'avoidable_er_rate',25.8,23.9,22,35,'below'),(2,2,'total_referral_specialty_pmpm',128.4,130.0,132,57,'at'),(2,2,'oon_referral_rate',7.9,8.3,8,51,'at'),
-- group 3: hospital-cost heavy, readmission issue
(3,3,'total_cost_pmpm',578,548,520,24,'below'),(3,3,'admissions_per_1000',264,241,225,22,'below'),(3,3,'er_visits_per_1000',332,314,295,28,'below'),(3,3,'readmission_rate_30d',17.6,15.9,13.5,18,'below'),(3,3,'quality_score_r12',80,78,78,61,'at'),(3,3,'access_score',74,73,75,48,'at'),(3,3,'referral_rate_100_pcp',25.8,25.2,25,47,'at'),(3,3,'awv_completion_rate',69.1,66.7,70,48,'at'),(3,3,'pcp_days_next_available',7.3,7.6,7,47,'at'),(3,3,'telehealth_utilization_rate',21.8,20.6,22,49,'at'),(3,3,'a1c_control_rate',69.4,68.9,70,49,'at'),(3,3,'bp_control_rate',73.7,72.6,74,48,'at'),(3,3,'total_inpatient_cost_pmpm',116.4,103.2,88.5,17,'below'),(3,3,'avoidable_er_rate',27.9,25.4,22,24,'below'),(3,3,'total_referral_specialty_pmpm',134.7,132.6,132,45,'at'),(3,3,'oon_referral_rate',8.5,8.2,8,46,'at'),
-- group 4: referral leakage problem, decent quality
(4,4,'total_cost_pmpm',538,522,520,42,'below'),(4,4,'admissions_per_1000',214,218,225,62,'above'),(4,4,'er_visits_per_1000',286,291,295,61,'above'),(4,4,'readmission_rate_30d',12.9,13.4,13.5,66,'above'),(4,4,'quality_score_r12',83,80,78,76,'above'),(4,4,'access_score',72,71,75,43,'below'),(4,4,'referral_rate_100_pcp',31.6,29.1,25,22,'below'),(4,4,'awv_completion_rate',67.4,64.0,70,43,'below'),(4,4,'pcp_days_next_available',7.9,8.2,7,39,'below'),(4,4,'telehealth_utilization_rate',19.6,17.4,22,38,'below'),(4,4,'a1c_control_rate',72.1,70.5,70,68,'above'),(4,4,'bp_control_rate',76.2,74.6,74,71,'above'),(4,4,'total_inpatient_cost_pmpm',84.1,86.9,88.5,68,'above'),(4,4,'avoidable_er_rate',20.9,21.8,22,62,'above'),(4,4,'total_referral_specialty_pmpm',163.8,149.5,132,19,'below'),(4,4,'oon_referral_rate',13.6,11.8,8,18,'below'),
-- group 5: largest/high-risk group, improving but still mixed
(5,5,'total_cost_pmpm',552,575,520,36,'below'),(5,5,'admissions_per_1000',236,258,225,38,'below'),(5,5,'er_visits_per_1000',315,344,295,36,'below'),(5,5,'readmission_rate_30d',14.8,16.3,13.5,39,'below'),(5,5,'quality_score_r12',79,74,78,58,'at'),(5,5,'access_score',76,70,75,64,'above'),(5,5,'referral_rate_100_pcp',26.9,28.4,25,42,'below'),(5,5,'awv_completion_rate',72.8,64.1,70,67,'above'),(5,5,'pcp_days_next_available',6.8,8.4,7,62,'above'),(5,5,'telehealth_utilization_rate',23.4,18.2,22,66,'above'),(5,5,'a1c_control_rate',68.6,64.2,70,44,'below'),(5,5,'bp_control_rate',72.8,70.1,74,47,'at'),(5,5,'total_inpatient_cost_pmpm',101.2,119.5,88.5,34,'below'),(5,5,'avoidable_er_rate',23.1,29.4,22,45,'below'),(5,5,'total_referral_specialty_pmpm',141.6,150.2,132,40,'below'),(5,5,'oon_referral_rate',9.2,10.9,8,42,'below')
)
INSERT INTO provider_metric_results (provider_id, contract_id, metric_definition_id, reporting_period, measurement_window, metric_value, prior_period_value, benchmark_value, vs_benchmark, percentile, status)
SELECT v.provider_id, v.contract_id, md.id, '2025-12-31', 'R12', v.metric_value, v.prior_value, v.benchmark_value,
CASE md.direction WHEN 'higher_better' THEN v.metric_value - v.benchmark_value ELSE v.benchmark_value - v.metric_value END,
v.percentile, v.status
FROM vals v JOIN metric_definitions md ON md.metric_name = v.metric_name;

-- monthly hospital metrics trending data (jan-25 through dec-25)
WITH monthly_vals(provider_id, contract_id, metric_name, reporting_month, metric_value, benchmark_value) AS (VALUES
-- Provider 1: Strong overall, improving trend
(1,1,'admissions_per_1000','2025-01-31',214,225),(1,1,'admissions_per_1000','2025-02-28',208,225),(1,1,'admissions_per_1000','2025-03-31',222,225),(1,1,'admissions_per_1000','2025-04-30',238,225),(1,1,'admissions_per_1000','2025-05-31',206,225),(1,1,'admissions_per_1000','2025-06-30',190,225),(1,1,'admissions_per_1000','2025-07-31',222,225),(1,1,'admissions_per_1000','2025-08-31',206,225),(1,1,'admissions_per_1000','2025-09-30',190,225),(1,1,'admissions_per_1000','2025-10-31',206,225),(1,1,'admissions_per_1000','2025-11-30',198,225),(1,1,'admissions_per_1000','2025-12-31',190,225),
(1,1,'er_visits_per_1000','2025-01-31',288,295),(1,1,'er_visits_per_1000','2025-02-28',290,295),(1,1,'er_visits_per_1000','2025-03-31',296,295),(1,1,'er_visits_per_1000','2025-04-30',348,295),(1,1,'er_visits_per_1000','2025-05-31',336,295),(1,1,'er_visits_per_1000','2025-06-30',314,295),(1,1,'er_visits_per_1000','2025-07-31',314,295),(1,1,'er_visits_per_1000','2025-08-31',348,295),(1,1,'er_visits_per_1000','2025-09-30',336,295),(1,1,'er_visits_per_1000','2025-10-31',328,295),(1,1,'er_visits_per_1000','2025-11-30',272,295),(1,1,'er_visits_per_1000','2025-12-31',262,295),
(1,1,'readmission_rate_30d','2025-01-31',12.6,13.5),(1,1,'readmission_rate_30d','2025-02-28',13.4,13.5),(1,1,'readmission_rate_30d','2025-03-31',13.8,13.5),(1,1,'readmission_rate_30d','2025-04-30',14.1,13.5),(1,1,'readmission_rate_30d','2025-05-31',13.9,13.5),(1,1,'readmission_rate_30d','2025-06-30',13.7,13.5),(1,1,'readmission_rate_30d','2025-07-31',14.2,13.5),(1,1,'readmission_rate_30d','2025-08-31',14.0,13.5),(1,1,'readmission_rate_30d','2025-09-30',13.8,13.5),(1,1,'readmission_rate_30d','2025-10-31',14.2,13.5),(1,1,'readmission_rate_30d','2025-11-30',11.8,13.5),(1,1,'readmission_rate_30d','2025-12-31',11.4,13.5),
(1,1,'avoidable_er_rate','2025-01-31',21.4,22),(1,1,'avoidable_er_rate','2025-02-28',23.2,22),(1,1,'avoidable_er_rate','2025-03-31',23.7,22),(1,1,'avoidable_er_rate','2025-04-30',24.5,22),(1,1,'avoidable_er_rate','2025-05-31',23.8,22),(1,1,'avoidable_er_rate','2025-06-30',22.9,22),(1,1,'avoidable_er_rate','2025-07-31',23.8,22),(1,1,'avoidable_er_rate','2025-08-31',23.7,22),(1,1,'avoidable_er_rate','2025-09-30',23.2,22),(1,1,'avoidable_er_rate','2025-10-31',23.7,22),(1,1,'avoidable_er_rate','2025-11-30',18.7,22),(1,1,'avoidable_er_rate','2025-12-31',17.9,22),
(1,1,'avg_cost_per_admission','2025-01-31',17840,18240),(1,1,'avg_cost_per_admission','2025-02-28',17920,18240),(1,1,'avg_cost_per_admission','2025-03-31',18040,18240),(1,1,'avg_cost_per_admission','2025-04-30',18120,18240),(1,1,'avg_cost_per_admission','2025-05-31',18240,18240),(1,1,'avg_cost_per_admission','2025-06-30',18200,18240),(1,1,'avg_cost_per_admission','2025-07-31',18320,18240),(1,1,'avg_cost_per_admission','2025-08-31',18360,18240),(1,1,'avg_cost_per_admission','2025-09-30',18400,18240),(1,1,'avg_cost_per_admission','2025-10-31',18400,18240),(1,1,'avg_cost_per_admission','2025-11-30',18360,18240),(1,1,'avg_cost_per_admission','2025-12-31',18280,18240),
(1,1,'total_inpatient_cost_pmpm','2025-01-31',84.2,88.5),(1,1,'total_inpatient_cost_pmpm','2025-02-28',93.2,88.5),(1,1,'total_inpatient_cost_pmpm','2025-03-31',94.1,88.5),(1,1,'total_inpatient_cost_pmpm','2025-04-30',95.9,88.5),(1,1,'total_inpatient_cost_pmpm','2025-05-31',96.4,88.5),(1,1,'total_inpatient_cost_pmpm','2025-06-30',97.1,88.5),(1,1,'total_inpatient_cost_pmpm','2025-07-31',97.8,88.5),(1,1,'total_inpatient_cost_pmpm','2025-08-31',98.0,88.5),(1,1,'total_inpatient_cost_pmpm','2025-09-30',98.4,88.5),(1,1,'total_inpatient_cost_pmpm','2025-10-31',98.4,88.5),(1,1,'total_inpatient_cost_pmpm','2025-11-30',78.6,88.5),(1,1,'total_inpatient_cost_pmpm','2025-12-31',76.8,88.5),
(1,1,'observation_stays_per_1000','2025-01-31',40.0,42.0),(1,1,'observation_stays_per_1000','2025-02-28',40.0,42.0),(1,1,'observation_stays_per_1000','2025-03-31',40.8,42.0),(1,1,'observation_stays_per_1000','2025-04-30',41.2,42.0),(1,1,'observation_stays_per_1000','2025-05-31',41.6,42.0),(1,1,'observation_stays_per_1000','2025-06-30',42.0,42.0),(1,1,'observation_stays_per_1000','2025-07-31',42.2,42.0),(1,1,'observation_stays_per_1000','2025-08-31',42.4,42.0),(1,1,'observation_stays_per_1000','2025-09-30',42.6,42.0),(1,1,'observation_stays_per_1000','2025-10-31',42.8,42.0),(1,1,'observation_stays_per_1000','2025-11-30',38.6,42.0),(1,1,'observation_stays_per_1000','2025-12-31',37.2,42.0),
(1,1,'snf_post_acute_cost_pmpm','2025-01-31',12.8,14.2),(1,1,'snf_post_acute_cost_pmpm','2025-02-28',13.0,14.2),(1,1,'snf_post_acute_cost_pmpm','2025-03-31',13.2,14.2),(1,1,'snf_post_acute_cost_pmpm','2025-04-30',13.6,14.2),(1,1,'snf_post_acute_cost_pmpm','2025-05-31',13.8,14.2),(1,1,'snf_post_acute_cost_pmpm','2025-06-30',14.0,14.2),(1,1,'snf_post_acute_cost_pmpm','2025-07-31',14.2,14.2),(1,1,'snf_post_acute_cost_pmpm','2025-08-31',14.2,14.2),(1,1,'snf_post_acute_cost_pmpm','2025-09-30',14.4,14.2),(1,1,'snf_post_acute_cost_pmpm','2025-10-31',14.6,14.2),(1,1,'snf_post_acute_cost_pmpm','2025-11-30',12.4,14.2),(1,1,'snf_post_acute_cost_pmpm','2025-12-31',11.8,14.2),
(1,1,'hospital_cost_score','2025-01-31',64.0,70),(1,1,'hospital_cost_score','2025-02-28',63.4,70),(1,1,'hospital_cost_score','2025-03-31',62.8,70),(1,1,'hospital_cost_score','2025-04-30',62.2,70),(1,1,'hospital_cost_score','2025-05-31',61.6,70),(1,1,'hospital_cost_score','2025-06-30',61.0,70),(1,1,'hospital_cost_score','2025-07-31',60.6,70),(1,1,'hospital_cost_score','2025-08-31',60.2,70),(1,1,'hospital_cost_score','2025-09-30',59.8,70),(1,1,'hospital_cost_score','2025-10-31',59.4,70),(1,1,'hospital_cost_score','2025-11-30',84.2,70),(1,1,'hospital_cost_score','2025-12-31',86.5,70),
-- Provider 2: Weak access/quality, stagnant performance
(2,2,'admissions_per_1000','2025-01-31',218,225),(2,2,'admissions_per_1000','2025-02-28',216,225),(2,2,'admissions_per_1000','2025-03-31',220,225),(2,2,'admissions_per_1000','2025-04-30',224,225),(2,2,'admissions_per_1000','2025-05-31',222,225),(2,2,'admissions_per_1000','2025-06-30',218,225),(2,2,'admissions_per_1000','2025-07-31',220,225),(2,2,'admissions_per_1000','2025-08-31',222,225),(2,2,'admissions_per_1000','2025-09-30',218,225),(2,2,'admissions_per_1000','2025-10-31',220,225),(2,2,'admissions_per_1000','2025-11-30',220,225),(2,2,'admissions_per_1000','2025-12-31',222,225),
(2,2,'er_visits_per_1000','2025-01-31',292,295),(2,2,'er_visits_per_1000','2025-02-28',298,295),(2,2,'er_visits_per_1000','2025-03-31',304,295),(2,2,'er_visits_per_1000','2025-04-30',310,295),(2,2,'er_visits_per_1000','2025-05-31',308,295),(2,2,'er_visits_per_1000','2025-06-30',306,295),(2,2,'er_visits_per_1000','2025-07-31',308,295),(2,2,'er_visits_per_1000','2025-08-31',310,295),(2,2,'er_visits_per_1000','2025-09-30',306,295),(2,2,'er_visits_per_1000','2025-10-31',304,295),(2,2,'er_visits_per_1000','2025-11-30',304,295),(2,2,'er_visits_per_1000','2025-12-31',306,295),
(2,2,'readmission_rate_30d','2025-01-31',13.2,13.5),(2,2,'readmission_rate_30d','2025-02-28',13.1,13.5),(2,2,'readmission_rate_30d','2025-03-31',13.4,13.5),(2,2,'readmission_rate_30d','2025-04-30',13.6,13.5),(2,2,'readmission_rate_30d','2025-05-31',13.5,13.5),(2,2,'readmission_rate_30d','2025-06-30',13.4,13.5),(2,2,'readmission_rate_30d','2025-07-31',13.6,13.5),(2,2,'readmission_rate_30d','2025-08-31',13.7,13.5),(2,2,'readmission_rate_30d','2025-09-30',13.5,13.5),(2,2,'readmission_rate_30d','2025-10-31',13.6,13.5),(2,2,'readmission_rate_30d','2025-11-30',13.7,13.5),(2,2,'readmission_rate_30d','2025-12-31',13.8,13.5),
(2,2,'avoidable_er_rate','2025-01-31',23.9,22),(2,2,'avoidable_er_rate','2025-02-28',24.2,22),(2,2,'avoidable_er_rate','2025-03-31',24.6,22),(2,2,'avoidable_er_rate','2025-04-30',25.2,22),(2,2,'avoidable_er_rate','2025-05-31',25.4,22),(2,2,'avoidable_er_rate','2025-06-30',25.6,22),(2,2,'avoidable_er_rate','2025-07-31',25.8,22),(2,2,'avoidable_er_rate','2025-08-31',26.0,22),(2,2,'avoidable_er_rate','2025-09-30',25.8,22),(2,2,'avoidable_er_rate','2025-10-31',25.6,22),(2,2,'avoidable_er_rate','2025-11-30',25.8,22),(2,2,'avoidable_er_rate','2025-12-31',26.2,22),
(2,2,'avg_cost_per_admission','2025-01-31',18120,18240),(2,2,'avg_cost_per_admission','2025-02-28',18160,18240),(2,2,'avg_cost_per_admission','2025-03-31',18200,18240),(2,2,'avg_cost_per_admission','2025-04-30',18240,18240),(2,2,'avg_cost_per_admission','2025-05-31',18280,18240),(2,2,'avg_cost_per_admission','2025-06-30',18300,18240),(2,2,'avg_cost_per_admission','2025-07-31',18340,18240),(2,2,'avg_cost_per_admission','2025-08-31',18380,18240),(2,2,'avg_cost_per_admission','2025-09-30',18400,18240),(2,2,'avg_cost_per_admission','2025-10-31',18420,18240),(2,2,'avg_cost_per_admission','2025-11-30',18440,18240),(2,2,'avg_cost_per_admission','2025-12-31',18460,18240),
(2,2,'total_inpatient_cost_pmpm','2025-01-31',86.4,88.5),(2,2,'total_inpatient_cost_pmpm','2025-02-28',87.2,88.5),(2,2,'total_inpatient_cost_pmpm','2025-03-31',87.8,88.5),(2,2,'total_inpatient_cost_pmpm','2025-04-30',88.2,88.5),(2,2,'total_inpatient_cost_pmpm','2025-05-31',88.6,88.5),(2,2,'total_inpatient_cost_pmpm','2025-06-30',88.9,88.5),(2,2,'total_inpatient_cost_pmpm','2025-07-31',89.2,88.5),(2,2,'total_inpatient_cost_pmpm','2025-08-31',89.5,88.5),(2,2,'total_inpatient_cost_pmpm','2025-09-30',89.6,88.5),(2,2,'total_inpatient_cost_pmpm','2025-10-31',89.7,88.5),(2,2,'total_inpatient_cost_pmpm','2025-11-30',89.8,88.5),(2,2,'total_inpatient_cost_pmpm','2025-12-31',90.1,88.5),
(2,2,'observation_stays_per_1000','2025-01-31',41.0,42.0),(2,2,'observation_stays_per_1000','2025-02-28',41.2,42.0),(2,2,'observation_stays_per_1000','2025-03-31',41.4,42.0),(2,2,'observation_stays_per_1000','2025-04-30',41.6,42.0),(2,2,'observation_stays_per_1000','2025-05-31',41.8,42.0),(2,2,'observation_stays_per_1000','2025-06-30',42.0,42.0),(2,2,'observation_stays_per_1000','2025-07-31',42.2,42.0),(2,2,'observation_stays_per_1000','2025-08-31',42.4,42.0),(2,2,'observation_stays_per_1000','2025-09-30',42.6,42.0),(2,2,'observation_stays_per_1000','2025-10-31',42.8,42.0),(2,2,'observation_stays_per_1000','2025-11-30',43.0,42.0),(2,2,'observation_stays_per_1000','2025-12-31',43.2,42.0),
(2,2,'snf_post_acute_cost_pmpm','2025-01-31',13.8,14.2),(2,2,'snf_post_acute_cost_pmpm','2025-02-28',13.9,14.2),(2,2,'snf_post_acute_cost_pmpm','2025-03-31',14.0,14.2),(2,2,'snf_post_acute_cost_pmpm','2025-04-30',14.1,14.2),(2,2,'snf_post_acute_cost_pmpm','2025-05-31',14.2,14.2),(2,2,'snf_post_acute_cost_pmpm','2025-06-30',14.3,14.2),(2,2,'snf_post_acute_cost_pmpm','2025-07-31',14.4,14.2),(2,2,'snf_post_acute_cost_pmpm','2025-08-31',14.5,14.2),(2,2,'snf_post_acute_cost_pmpm','2025-09-30',14.6,14.2),(2,2,'snf_post_acute_cost_pmpm','2025-10-31',14.7,14.2),(2,2,'snf_post_acute_cost_pmpm','2025-11-30',14.8,14.2),(2,2,'snf_post_acute_cost_pmpm','2025-12-31',14.9,14.2),
(2,2,'hospital_cost_score','2025-01-31',68.0,70),(2,2,'hospital_cost_score','2025-02-28',68.2,70),(2,2,'hospital_cost_score','2025-03-31',68.4,70),(2,2,'hospital_cost_score','2025-04-30',68.6,70),(2,2,'hospital_cost_score','2025-05-31',68.8,70),(2,2,'hospital_cost_score','2025-06-30',68.6,70),(2,2,'hospital_cost_score','2025-07-31',68.4,70),(2,2,'hospital_cost_score','2025-08-31',68.2,70),(2,2,'hospital_cost_score','2025-09-30',68.0,70),(2,2,'hospital_cost_score','2025-10-31',67.8,70),(2,2,'hospital_cost_score','2025-11-30',67.6,70),(2,2,'hospital_cost_score','2025-12-31',67.4,70),
-- Provider 3: Hospital-cost heavy, readmission issues
(3,3,'admissions_per_1000','2025-01-31',241,225),(3,3,'admissions_per_1000','2025-02-28',245,225),(3,3,'admissions_per_1000','2025-03-31',248,225),(3,3,'admissions_per_1000','2025-04-30',252,225),(3,3,'admissions_per_1000','2025-05-31',255,225),(3,3,'admissions_per_1000','2025-06-30',258,225),(3,3,'admissions_per_1000','2025-07-31',260,225),(3,3,'admissions_per_1000','2025-08-31',262,225),(3,3,'admissions_per_1000','2025-09-30',264,225),(3,3,'admissions_per_1000','2025-10-31',266,225),(3,3,'admissions_per_1000','2025-11-30',268,225),(3,3,'admissions_per_1000','2025-12-31',270,225),
(3,3,'er_visits_per_1000','2025-01-31',314,295),(3,3,'er_visits_per_1000','2025-02-28',318,295),(3,3,'er_visits_per_1000','2025-03-31',322,295),(3,3,'er_visits_per_1000','2025-04-30',326,295),(3,3,'er_visits_per_1000','2025-05-31',328,295),(3,3,'er_visits_per_1000','2025-06-30',330,295),(3,3,'er_visits_per_1000','2025-07-31',332,295),(3,3,'er_visits_per_1000','2025-08-31',334,295),(3,3,'er_visits_per_1000','2025-09-30',336,295),(3,3,'er_visits_per_1000','2025-10-31',338,295),(3,3,'er_visits_per_1000','2025-11-30',340,295),(3,3,'er_visits_per_1000','2025-12-31',342,295),
(3,3,'readmission_rate_30d','2025-01-31',15.9,13.5),(3,3,'readmission_rate_30d','2025-02-28',16.1,13.5),(3,3,'readmission_rate_30d','2025-03-31',16.3,13.5),(3,3,'readmission_rate_30d','2025-04-30',16.5,13.5),(3,3,'readmission_rate_30d','2025-05-31',16.7,13.5),(3,3,'readmission_rate_30d','2025-06-30',16.9,13.5),(3,3,'readmission_rate_30d','2025-07-31',17.1,13.5),(3,3,'readmission_rate_30d','2025-08-31',17.3,13.5),(3,3,'readmission_rate_30d','2025-09-30',17.5,13.5),(3,3,'readmission_rate_30d','2025-10-31',17.7,13.5),(3,3,'readmission_rate_30d','2025-11-30',17.8,13.5),(3,3,'readmission_rate_30d','2025-12-31',17.9,13.5),
(3,3,'avoidable_er_rate','2025-01-31',25.4,22),(3,3,'avoidable_er_rate','2025-02-28',25.8,22),(3,3,'avoidable_er_rate','2025-03-31',26.2,22),(3,3,'avoidable_er_rate','2025-04-30',26.5,22),(3,3,'avoidable_er_rate','2025-05-31',26.8,22),(3,3,'avoidable_er_rate','2025-06-30',27.0,22),(3,3,'avoidable_er_rate','2025-07-31',27.2,22),(3,3,'avoidable_er_rate','2025-08-31',27.4,22),(3,3,'avoidable_er_rate','2025-09-30',27.6,22),(3,3,'avoidable_er_rate','2025-10-31',27.8,22),(3,3,'avoidable_er_rate','2025-11-30',27.9,22),(3,3,'avoidable_er_rate','2025-12-31',28.1,22),
(3,3,'avg_cost_per_admission','2025-01-31',18960,18240),(3,3,'avg_cost_per_admission','2025-02-28',19020,18240),(3,3,'avg_cost_per_admission','2025-03-31',19080,18240),(3,3,'avg_cost_per_admission','2025-04-30',19140,18240),(3,3,'avg_cost_per_admission','2025-05-31',19200,18240),(3,3,'avg_cost_per_admission','2025-06-30',19260,18240),(3,3,'avg_cost_per_admission','2025-07-31',19320,18240),(3,3,'avg_cost_per_admission','2025-08-31',19380,18240),(3,3,'avg_cost_per_admission','2025-09-30',19440,18240),(3,3,'avg_cost_per_admission','2025-10-31',19500,18240),(3,3,'avg_cost_per_admission','2025-11-30',19560,18240),(3,3,'avg_cost_per_admission','2025-12-31',19620,18240),
(3,3,'total_inpatient_cost_pmpm','2025-01-31',103.2,88.5),(3,3,'total_inpatient_cost_pmpm','2025-02-28',104.5,88.5),(3,3,'total_inpatient_cost_pmpm','2025-03-31',105.8,88.5),(3,3,'total_inpatient_cost_pmpm','2025-04-30',107.1,88.5),(3,3,'total_inpatient_cost_pmpm','2025-05-31',108.4,88.5),(3,3,'total_inpatient_cost_pmpm','2025-06-30',109.7,88.5),(3,3,'total_inpatient_cost_pmpm','2025-07-31',111.0,88.5),(3,3,'total_inpatient_cost_pmpm','2025-08-31',112.3,88.5),(3,3,'total_inpatient_cost_pmpm','2025-09-30',113.6,88.5),(3,3,'total_inpatient_cost_pmpm','2025-10-31',114.9,88.5),(3,3,'total_inpatient_cost_pmpm','2025-11-30',116.0,88.5),(3,3,'total_inpatient_cost_pmpm','2025-12-31',117.2,88.5),
(3,3,'observation_stays_per_1000','2025-01-31',43.5,42.0),(3,3,'observation_stays_per_1000','2025-02-28',43.8,42.0),(3,3,'observation_stays_per_1000','2025-03-31',44.1,42.0),(3,3,'observation_stays_per_1000','2025-04-30',44.4,42.0),(3,3,'observation_stays_per_1000','2025-05-31',44.7,42.0),(3,3,'observation_stays_per_1000','2025-06-30',45.0,42.0),(3,3,'observation_stays_per_1000','2025-07-31',45.2,42.0),(3,3,'observation_stays_per_1000','2025-08-31',45.4,42.0),(3,3,'observation_stays_per_1000','2025-09-30',45.6,42.0),(3,3,'observation_stays_per_1000','2025-10-31',45.8,42.0),(3,3,'observation_stays_per_1000','2025-11-30',46.0,42.0),(3,3,'observation_stays_per_1000','2025-12-31',46.2,42.0),
(3,3,'snf_post_acute_cost_pmpm','2025-01-31',15.2,14.2),(3,3,'snf_post_acute_cost_pmpm','2025-02-28',15.4,14.2),(3,3,'snf_post_acute_cost_pmpm','2025-03-31',15.6,14.2),(3,3,'snf_post_acute_cost_pmpm','2025-04-30',15.8,14.2),(3,3,'snf_post_acute_cost_pmpm','2025-05-31',16.0,14.2),(3,3,'snf_post_acute_cost_pmpm','2025-06-30',16.2,14.2),(3,3,'snf_post_acute_cost_pmpm','2025-07-31',16.4,14.2),(3,3,'snf_post_acute_cost_pmpm','2025-08-31',16.6,14.2),(3,3,'snf_post_acute_cost_pmpm','2025-09-30',16.8,14.2),(3,3,'snf_post_acute_cost_pmpm','2025-10-31',17.0,14.2),(3,3,'snf_post_acute_cost_pmpm','2025-11-30',17.2,14.2),(3,3,'snf_post_acute_cost_pmpm','2025-12-31',17.4,14.2),
(3,3,'hospital_cost_score','2025-01-31',49.0,70),(3,3,'hospital_cost_score','2025-02-28',48.8,70),(3,3,'hospital_cost_score','2025-03-31',48.6,70),(3,3,'hospital_cost_score','2025-04-30',48.4,70),(3,3,'hospital_cost_score','2025-05-31',48.2,70),(3,3,'hospital_cost_score','2025-06-30',48.0,70),(3,3,'hospital_cost_score','2025-07-31',47.8,70),(3,3,'hospital_cost_score','2025-08-31',47.6,70),(3,3,'hospital_cost_score','2025-09-30',47.4,70),(3,3,'hospital_cost_score','2025-10-31',47.2,70),(3,3,'hospital_cost_score','2025-11-30',47.0,70),(3,3,'hospital_cost_score','2025-12-31',46.8,70),
-- Provider 4: Referral leakage, decent hospital performance
(4,4,'admissions_per_1000','2025-01-31',218,225),(4,4,'admissions_per_1000','2025-02-28',217,225),(4,4,'admissions_per_1000','2025-03-31',216,225),(4,4,'admissions_per_1000','2025-04-30',215,225),(4,4,'admissions_per_1000','2025-05-31',214,225),(4,4,'admissions_per_1000','2025-06-30',213,225),(4,4,'admissions_per_1000','2025-07-31',212,225),(4,4,'admissions_per_1000','2025-08-31',211,225),(4,4,'admissions_per_1000','2025-09-30',210,225),(4,4,'admissions_per_1000','2025-10-31',209,225),(4,4,'admissions_per_1000','2025-11-30',208,225),(4,4,'admissions_per_1000','2025-12-31',207,225),
(4,4,'er_visits_per_1000','2025-01-31',291,295),(4,4,'er_visits_per_1000','2025-02-28',290,295),(4,4,'er_visits_per_1000','2025-03-31',289,295),(4,4,'er_visits_per_1000','2025-04-30',288,295),(4,4,'er_visits_per_1000','2025-05-31',287,295),(4,4,'er_visits_per_1000','2025-06-30',286,295),(4,4,'er_visits_per_1000','2025-07-31',285,295),(4,4,'er_visits_per_1000','2025-08-31',284,295),(4,4,'er_visits_per_1000','2025-09-30',283,295),(4,4,'er_visits_per_1000','2025-10-31',282,295),(4,4,'er_visits_per_1000','2025-11-30',281,295),(4,4,'er_visits_per_1000','2025-12-31',280,295),
(4,4,'readmission_rate_30d','2025-01-31',13.4,13.5),(4,4,'readmission_rate_30d','2025-02-28',13.3,13.5),(4,4,'readmission_rate_30d','2025-03-31',13.2,13.5),(4,4,'readmission_rate_30d','2025-04-30',13.1,13.5),(4,4,'readmission_rate_30d','2025-05-31',13.0,13.5),(4,4,'readmission_rate_30d','2025-06-30',12.9,13.5),(4,4,'readmission_rate_30d','2025-07-31',12.8,13.5),(4,4,'readmission_rate_30d','2025-08-31',12.7,13.5),(4,4,'readmission_rate_30d','2025-09-30',12.6,13.5),(4,4,'readmission_rate_30d','2025-10-31',12.5,13.5),(4,4,'readmission_rate_30d','2025-11-30',12.4,13.5),(4,4,'readmission_rate_30d','2025-12-31',12.3,13.5),
(4,4,'avoidable_er_rate','2025-01-31',21.8,22),(4,4,'avoidable_er_rate','2025-02-28',21.7,22),(4,4,'avoidable_er_rate','2025-03-31',21.6,22),(4,4,'avoidable_er_rate','2025-04-30',21.5,22),(4,4,'avoidable_er_rate','2025-05-31',21.4,22),(4,4,'avoidable_er_rate','2025-06-30',21.3,22),(4,4,'avoidable_er_rate','2025-07-31',21.2,22),(4,4,'avoidable_er_rate','2025-08-31',21.1,22),(4,4,'avoidable_er_rate','2025-09-30',21.0,22),(4,4,'avoidable_er_rate','2025-10-31',20.9,22),(4,4,'avoidable_er_rate','2025-11-30',20.8,22),(4,4,'avoidable_er_rate','2025-12-31',20.7,22),
(4,4,'avg_cost_per_admission','2025-01-31',17680,18240),(4,4,'avg_cost_per_admission','2025-02-28',17720,18240),(4,4,'avg_cost_per_admission','2025-03-31',17760,18240),(4,4,'avg_cost_per_admission','2025-04-30',17800,18240),(4,4,'avg_cost_per_admission','2025-05-31',17840,18240),(4,4,'avg_cost_per_admission','2025-06-30',17880,18240),(4,4,'avg_cost_per_admission','2025-07-31',17920,18240),(4,4,'avg_cost_per_admission','2025-08-31',17960,18240),(4,4,'avg_cost_per_admission','2025-09-30',18000,18240),(4,4,'avg_cost_per_admission','2025-10-31',18040,18240),(4,4,'avg_cost_per_admission','2025-11-30',18080,18240),(4,4,'avg_cost_per_admission','2025-12-31',18120,18240),
(4,4,'total_inpatient_cost_pmpm','2025-01-31',86.9,88.5),(4,4,'total_inpatient_cost_pmpm','2025-02-28',86.7,88.5),(4,4,'total_inpatient_cost_pmpm','2025-03-31',86.5,88.5),(4,4,'total_inpatient_cost_pmpm','2025-04-30',86.3,88.5),(4,4,'total_inpatient_cost_pmpm','2025-05-31',86.1,88.5),(4,4,'total_inpatient_cost_pmpm','2025-06-30',85.9,88.5),(4,4,'total_inpatient_cost_pmpm','2025-07-31',85.7,88.5),(4,4,'total_inpatient_cost_pmpm','2025-08-31',85.5,88.5),(4,4,'total_inpatient_cost_pmpm','2025-09-30',85.3,88.5),(4,4,'total_inpatient_cost_pmpm','2025-10-31',85.1,88.5),(4,4,'total_inpatient_cost_pmpm','2025-11-30',84.9,88.5),(4,4,'total_inpatient_cost_pmpm','2025-12-31',84.7,88.5),
(4,4,'observation_stays_per_1000','2025-01-31',40.5,42.0),(4,4,'observation_stays_per_1000','2025-02-28',40.3,42.0),(4,4,'observation_stays_per_1000','2025-03-31',40.1,42.0),(4,4,'observation_stays_per_1000','2025-04-30',39.9,42.0),(4,4,'observation_stays_per_1000','2025-05-31',39.7,42.0),(4,4,'observation_stays_per_1000','2025-06-30',39.5,42.0),(4,4,'observation_stays_per_1000','2025-07-31',39.3,42.0),(4,4,'observation_stays_per_1000','2025-08-31',39.1,42.0),(4,4,'observation_stays_per_1000','2025-09-30',38.9,42.0),(4,4,'observation_stays_per_1000','2025-10-31',38.7,42.0),(4,4,'observation_stays_per_1000','2025-11-30',38.5,42.0),(4,4,'observation_stays_per_1000','2025-12-31',38.3,42.0),
(4,4,'snf_post_acute_cost_pmpm','2025-01-31',13.6,14.2),(4,4,'snf_post_acute_cost_pmpm','2025-02-28',13.5,14.2),(4,4,'snf_post_acute_cost_pmpm','2025-03-31',13.4,14.2),(4,4,'snf_post_acute_cost_pmpm','2025-04-30',13.3,14.2),(4,4,'snf_post_acute_cost_pmpm','2025-05-31',13.2,14.2),(4,4,'snf_post_acute_cost_pmpm','2025-06-30',13.1,14.2),(4,4,'snf_post_acute_cost_pmpm','2025-07-31',13.0,14.2),(4,4,'snf_post_acute_cost_pmpm','2025-08-31',12.9,14.2),(4,4,'snf_post_acute_cost_pmpm','2025-09-30',12.8,14.2),(4,4,'snf_post_acute_cost_pmpm','2025-10-31',12.7,14.2),(4,4,'snf_post_acute_cost_pmpm','2025-11-30',12.6,14.2),(4,4,'snf_post_acute_cost_pmpm','2025-12-31',12.5,14.2),
(4,4,'hospital_cost_score','2025-01-31',76.0,70),(4,4,'hospital_cost_score','2025-02-28',76.2,70),(4,4,'hospital_cost_score','2025-03-31',76.4,70),(4,4,'hospital_cost_score','2025-04-30',76.6,70),(4,4,'hospital_cost_score','2025-05-31',76.8,70),(4,4,'hospital_cost_score','2025-06-30',77.0,70),(4,4,'hospital_cost_score','2025-07-31',77.2,70),(4,4,'hospital_cost_score','2025-08-31',77.4,70),(4,4,'hospital_cost_score','2025-09-30',77.6,70),(4,4,'hospital_cost_score','2025-10-31',77.8,70),(4,4,'hospital_cost_score','2025-11-30',78.0,70),(4,4,'hospital_cost_score','2025-12-31',78.2,70),
-- Provider 5: Largest/high-risk, improving
(5,5,'admissions_per_1000','2025-01-31',258,225),(5,5,'admissions_per_1000','2025-02-28',256,225),(5,5,'admissions_per_1000','2025-03-31',254,225),(5,5,'admissions_per_1000','2025-04-30',252,225),(5,5,'admissions_per_1000','2025-05-31',250,225),(5,5,'admissions_per_1000','2025-06-30',248,225),(5,5,'admissions_per_1000','2025-07-31',246,225),(5,5,'admissions_per_1000','2025-08-31',244,225),(5,5,'admissions_per_1000','2025-09-30',242,225),(5,5,'admissions_per_1000','2025-10-31',240,225),(5,5,'admissions_per_1000','2025-11-30',238,225),(5,5,'admissions_per_1000','2025-12-31',236,225),
(5,5,'er_visits_per_1000','2025-01-31',344,295),(5,5,'er_visits_per_1000','2025-02-28',341,295),(5,5,'er_visits_per_1000','2025-03-31',338,295),(5,5,'er_visits_per_1000','2025-04-30',335,295),(5,5,'er_visits_per_1000','2025-05-31',332,295),(5,5,'er_visits_per_1000','2025-06-30',329,295),(5,5,'er_visits_per_1000','2025-07-31',326,295),(5,5,'er_visits_per_1000','2025-08-31',323,295),(5,5,'er_visits_per_1000','2025-09-30',320,295),(5,5,'er_visits_per_1000','2025-10-31',317,295),(5,5,'er_visits_per_1000','2025-11-30',315,295),(5,5,'er_visits_per_1000','2025-12-31',312,295),
(5,5,'readmission_rate_30d','2025-01-31',16.3,13.5),(5,5,'readmission_rate_30d','2025-02-28',16.2,13.5),(5,5,'readmission_rate_30d','2025-03-31',16.1,13.5),(5,5,'readmission_rate_30d','2025-04-30',16.0,13.5),(5,5,'readmission_rate_30d','2025-05-31',15.9,13.5),(5,5,'readmission_rate_30d','2025-06-30',15.8,13.5),(5,5,'readmission_rate_30d','2025-07-31',15.7,13.5),(5,5,'readmission_rate_30d','2025-08-31',15.6,13.5),(5,5,'readmission_rate_30d','2025-09-30',15.5,13.5),(5,5,'readmission_rate_30d','2025-10-31',15.4,13.5),(5,5,'readmission_rate_30d','2025-11-30',15.2,13.5),(5,5,'readmission_rate_30d','2025-12-31',14.8,13.5),
(5,5,'avoidable_er_rate','2025-01-31',29.4,22),(5,5,'avoidable_er_rate','2025-02-28',29.0,22),(5,5,'avoidable_er_rate','2025-03-31',28.6,22),(5,5,'avoidable_er_rate','2025-04-30',28.2,22),(5,5,'avoidable_er_rate','2025-05-31',27.8,22),(5,5,'avoidable_er_rate','2025-06-30',27.4,22),(5,5,'avoidable_er_rate','2025-07-31',27.0,22),(5,5,'avoidable_er_rate','2025-08-31',26.6,22),(5,5,'avoidable_er_rate','2025-09-30',26.2,22),(5,5,'avoidable_er_rate','2025-10-31',25.8,22),(5,5,'avoidable_er_rate','2025-11-30',24.8,22),(5,5,'avoidable_er_rate','2025-12-31',23.1,22),
(5,5,'avg_cost_per_admission','2025-01-31',19840,18240),(5,5,'avg_cost_per_admission','2025-02-28',19760,18240),(5,5,'avg_cost_per_admission','2025-03-31',19680,18240),(5,5,'avg_cost_per_admission','2025-04-30',19600,18240),(5,5,'avg_cost_per_admission','2025-05-31',19520,18240),(5,5,'avg_cost_per_admission','2025-06-30',19440,18240),(5,5,'avg_cost_per_admission','2025-07-31',19360,18240),(5,5,'avg_cost_per_admission','2025-08-31',19280,18240),(5,5,'avg_cost_per_admission','2025-09-30',19200,18240),(5,5,'avg_cost_per_admission','2025-10-31',19120,18240),(5,5,'avg_cost_per_admission','2025-11-30',19040,18240),(5,5,'avg_cost_per_admission','2025-12-31',18960,18240),
(5,5,'total_inpatient_cost_pmpm','2025-01-31',119.5,88.5),(5,5,'total_inpatient_cost_pmpm','2025-02-28',118.2,88.5),(5,5,'total_inpatient_cost_pmpm','2025-03-31',116.9,88.5),(5,5,'total_inpatient_cost_pmpm','2025-04-30',115.6,88.5),(5,5,'total_inpatient_cost_pmpm','2025-05-31',114.3,88.5),(5,5,'total_inpatient_cost_pmpm','2025-06-30',113.0,88.5),(5,5,'total_inpatient_cost_pmpm','2025-07-31',111.7,88.5),(5,5,'total_inpatient_cost_pmpm','2025-08-31',110.4,88.5),(5,5,'total_inpatient_cost_pmpm','2025-09-30',109.1,88.5),(5,5,'total_inpatient_cost_pmpm','2025-10-31',107.8,88.5),(5,5,'total_inpatient_cost_pmpm','2025-11-30',105.4,88.5),(5,5,'total_inpatient_cost_pmpm','2025-12-31',101.2,88.5),
(5,5,'observation_stays_per_1000','2025-01-31',46.8,42.0),(5,5,'observation_stays_per_1000','2025-02-28',46.4,42.0),(5,5,'observation_stays_per_1000','2025-03-31',46.0,42.0),(5,5,'observation_stays_per_1000','2025-04-30',45.6,42.0),(5,5,'observation_stays_per_1000','2025-05-31',45.2,42.0),(5,5,'observation_stays_per_1000','2025-06-30',44.8,42.0),(5,5,'observation_stays_per_1000','2025-07-31',44.4,42.0),(5,5,'observation_stays_per_1000','2025-08-31',44.0,42.0),(5,5,'observation_stays_per_1000','2025-09-30',43.6,42.0),(5,5,'observation_stays_per_1000','2025-10-31',43.2,42.0),(5,5,'observation_stays_per_1000','2025-11-30',42.8,42.0),(5,5,'observation_stays_per_1000','2025-12-31',42.4,42.0),
(5,5,'snf_post_acute_cost_pmpm','2025-01-31',16.8,14.2),(5,5,'snf_post_acute_cost_pmpm','2025-02-28',16.6,14.2),(5,5,'snf_post_acute_cost_pmpm','2025-03-31',16.4,14.2),(5,5,'snf_post_acute_cost_pmpm','2025-04-30',16.2,14.2),(5,5,'snf_post_acute_cost_pmpm','2025-05-31',16.0,14.2),(5,5,'snf_post_acute_cost_pmpm','2025-06-30',15.8,14.2),(5,5,'snf_post_acute_cost_pmpm','2025-07-31',15.6,14.2),(5,5,'snf_post_acute_cost_pmpm','2025-08-31',15.4,14.2),(5,5,'snf_post_acute_cost_pmpm','2025-09-30',15.2,14.2),(5,5,'snf_post_acute_cost_pmpm','2025-10-31',15.0,14.2),(5,5,'snf_post_acute_cost_pmpm','2025-11-30',14.6,14.2),(5,5,'snf_post_acute_cost_pmpm','2025-12-31',14.0,14.2),
(5,5,'hospital_cost_score','2025-01-31',51.0,70),(5,5,'hospital_cost_score','2025-02-28',52.0,70),(5,5,'hospital_cost_score','2025-03-31',53.0,70),(5,5,'hospital_cost_score','2025-04-30',54.0,70),(5,5,'hospital_cost_score','2025-05-31',55.0,70),(5,5,'hospital_cost_score','2025-06-30',56.0,70),(5,5,'hospital_cost_score','2025-07-31',57.0,70),(5,5,'hospital_cost_score','2025-08-31',58.0,70),(5,5,'hospital_cost_score','2025-09-30',59.0,70),(5,5,'hospital_cost_score','2025-10-31',60.0,70),(5,5,'hospital_cost_score','2025-11-30',61.2,70),(5,5,'hospital_cost_score','2025-12-31',62.4,70)
)
INSERT INTO provider_metric_results (provider_id, contract_id, metric_definition_id, reporting_period, measurement_window, metric_value, benchmark_value, vs_benchmark, status)
SELECT mv.provider_id, mv.contract_id, md.id, mv.reporting_month::DATE, 'monthly', mv.metric_value, mv.benchmark_value,
CASE md.direction WHEN 'higher_better' THEN mv.metric_value - mv.benchmark_value ELSE mv.benchmark_value - mv.metric_value END,
CASE 
  WHEN md.direction = 'higher_better' AND mv.metric_value >= mv.benchmark_value THEN 'above'
  WHEN md.direction = 'lower_better' AND mv.metric_value <= mv.benchmark_value THEN 'above'
  ELSE 'below'
END
FROM monthly_vals mv JOIN metric_definitions md ON md.metric_name = mv.metric_name;

-- domain scores calculated to align to group stories
WITH ds(provider_id, contract_id, domain_name, score, bench, capture) AS (VALUES
(1,1,'Access & Timeliness',81,75,92),(1,1,'Quality / Care Gaps',86,78,96),(1,1,'Hospital Costs',84,70,90),(1,1,'Referral & Specialty Costs',82,72,88),
(2,2,'Access & Timeliness',63,75,48),(2,2,'Quality / Care Gaps',71,78,58),(2,2,'Hospital Costs',68,70,66),(2,2,'Referral & Specialty Costs',72,72,74),
(3,3,'Access & Timeliness',74,75,70),(3,3,'Quality / Care Gaps',80,78,82),(3,3,'Hospital Costs',49,70,38),(3,3,'Referral & Specialty Costs',68,72,64),
(4,4,'Access & Timeliness',72,75,64),(4,4,'Quality / Care Gaps',83,78,88),(4,4,'Hospital Costs',76,70,82),(4,4,'Referral & Specialty Costs',51,72,42),
(5,5,'Access & Timeliness',76,75,78),(5,5,'Quality / Care Gaps',79,78,78),(5,5,'Hospital Costs',61,70,55),(5,5,'Referral & Specialty Costs',66,72,62)
)
INSERT INTO domain_scores (provider_id, contract_id, domain_id, reporting_period, measurement_window, r12_score, benchmark_score, vs_benchmark, available_amount, earned_amount, missed_amount, capture_rate)
SELECT ds.provider_id, ds.contract_id, vd.id, '2025-12-31', 'R12', ds.score, ds.bench, ds.score - ds.bench,
vd.available_amount, ROUND(vd.available_amount * ds.capture / 100.0, 2), ROUND(vd.available_amount * (100 - ds.capture) / 100.0, 2), ds.capture
FROM ds JOIN vbp_domains vd ON vd.contract_id = ds.contract_id AND vd.domain_name = ds.domain_name;

-- members: 6 per group, synthetic
INSERT INTO members (organization_id, member_external_id, member_name, dob, gender, risk_score, primary_provider_id) VALUES
(1,'AVP-1001','Carolyn Hughes','1952-04-18','F',1.72,1),(1,'AVP-1002','Michael Stanton','1949-09-07','M',2.14,1),(1,'AVP-1003','Linda Parker','1961-11-22','F',1.18,1),(1,'AVP-1004','Robert Fields','1958-03-13','M',0.84,1),(1,'AVP-1005','Janet Coleman','1955-07-30','F',1.36,1),(1,'AVP-1006','Dennis Wright','1947-12-04','M',2.41,1),
(2,'PHF-2001','Nancy Brewer','1954-02-10','F',1.64,2),(2,'PHF-2002','Harold Simmons','1950-10-28','M',1.88,2),(2,'PHF-2003','Betty Flores','1964-05-06','F',1.07,2),(2,'PHF-2004','Alan Reeves','1959-08-19','M',0.93,2),(2,'PHF-2005','Donna Kelley','1948-01-17','F',2.22,2),(2,'PHF-2006','Gary Lawson','1956-06-02','M',1.45,2),
(3,'ICT-3001','Marsha Green','1951-01-24','F',2.61,3),(3,'ICT-3002','Walter King','1946-09-12','M',2.84,3),(3,'ICT-3003','Evelyn Morris','1953-12-11','F',1.92,3),(3,'ICT-3004','Patrick Ward','1960-03-29','M',1.31,3),(3,'ICT-3005','Sharon Price','1957-04-15','F',1.77,3),(3,'ICT-3006','Donald Peterson','1949-06-21','M',2.48,3),
(4,'RMW-4001','Gloria Russell','1958-02-26','F',1.24,4),(4,'RMW-4002','Kenneth Butler','1952-08-05','M',1.96,4),(4,'RMW-4003','Patricia Barnes','1962-10-09','F',0.98,4),(4,'RMW-4004','Frank Foster','1956-12-20','M',1.52,4),(4,'RMW-4005','Susan Hayes','1947-05-03','F',2.16,4),(4,'RMW-4006','Roger Jenkins','1951-11-18','M',1.67,4),
(5,'ACP-5001','Brenda Cox','1949-03-08','F',2.38,5),(5,'ACP-5002','George Ramirez','1955-07-14','M',2.05,5),(5,'ACP-5003','Kathleen Morgan','1960-04-27','F',1.34,5),(5,'ACP-5004','Larry Cooper','1946-01-09','M',2.92,5),(5,'ACP-5005','Pamela Sanders','1957-09-16','F',1.74,5),(5,'ACP-5006','Arthur Mitchell','1952-06-25','M',2.31,5);

INSERT INTO member_attribution (member_id, provider_id, contract_id, attribution_month, attribution_start_date, attribution_end_date, attribution_status)
SELECT m.id, m.primary_provider_id, m.organization_id, '2025-12-01', '2025-01-01', '2025-12-31', 'active'
FROM members m;

-- risk monthly dec-25
INSERT INTO member_risk_monthly (member_id, reporting_month, risk_score, risk_tier, predicted_admit_probability, avg_cost_pmpm, care_management_recommended_flag)
SELECT id, '2025-12-01', risk_score,
CASE WHEN risk_score >= 2.25 THEN 'High Risk' WHEN risk_score >= 1.50 THEN 'Rising Risk' WHEN risk_score >= 1.00 THEN 'Moderate Risk' ELSE 'Low Risk' END,
CASE WHEN risk_score >= 2.5 THEN 55 + (risk_score*4) WHEN risk_score >= 2.0 THEN 38 + (risk_score*3) WHEN risk_score >= 1.5 THEN 24 + (risk_score*2) ELSE 10 + (risk_score*2) END,
ROUND((350 + risk_score * 260)::numeric, 2), risk_score >= 1.75
FROM members;

INSERT INTO member_conditions (member_id, condition_name, condition_category, diagnosis_date, controlled_flag, last_measured_date)
SELECT id, 'Hypertension', 'Cardiometabolic', '2022-03-01', risk_score < 2.0, '2025-10-15' FROM members WHERE risk_score >= 1.0;
INSERT INTO member_conditions (member_id, condition_name, condition_category, diagnosis_date, controlled_flag, last_measured_date)
SELECT id, 'Diabetes (Type 2)', 'Cardiometabolic', '2021-05-01', risk_score < 1.9, '2025-11-01' FROM members WHERE id IN (1,2,5,7,8,11,13,15,18,20,23,25,26,28,30);
INSERT INTO member_conditions (member_id, condition_name, condition_category, diagnosis_date, controlled_flag, last_measured_date)
SELECT id, 'CHF', 'Cardiac', '2020-08-01', FALSE, '2025-09-22' FROM members WHERE id IN (2,6,13,14,18,25,28);
INSERT INTO member_conditions (member_id, condition_name, condition_category, diagnosis_date, controlled_flag, last_measured_date)
SELECT id, 'CKD', 'Renal', '2021-02-01', FALSE, '2025-09-15' FROM members WHERE id IN (6,14,18,25,28,30);
INSERT INTO member_conditions (member_id, condition_name, condition_category, diagnosis_date, controlled_flag, last_measured_date)
SELECT id, 'COPD / Asthma', 'Pulmonary', '2023-01-01', risk_score < 2.2, '2025-08-20' FROM members WHERE id IN (8,13,15,18,24,28);

-- cost summaries by provider/category
WITH cs(provider_id, contract_id, category, pmpm, yoy_delta_percent, pct_total) AS (VALUES
(1,1,'Inpatient / Hospital',78.6,-6.7,16.2),(1,1,'Emergency Room',31.5,-4.2,6.5),(1,1,'Professional / Office Visits',108.4,3.1,22.3),(1,1,'Referral & Specialty',119.4,-5.3,24.6),(1,1,'Specialty Drugs',64.2,2.8,13.2),(1,1,'Behavioral Health',27.8,5.1,5.7),(1,1,'Other',56.1,-1.9,11.5),
(2,2,'Inpatient / Hospital',89.8,3.9,17.4),(2,2,'Emergency Room',40.4,7.8,7.8),(2,2,'Professional / Office Visits',101.2,-1.2,19.7),(2,2,'Referral & Specialty',128.4,-1.2,24.9),(2,2,'Specialty Drugs',72.2,4.9,14.0),(2,2,'Behavioral Health',31.8,8.1,6.2),(2,2,'Other',51.2,1.1,10.0),
(3,3,'Inpatient / Hospital',116.4,12.8,20.1),(3,3,'Emergency Room',48.8,8.9,8.4),(3,3,'Professional / Office Visits',103.1,1.9,17.8),(3,3,'Referral & Specialty',134.7,1.6,23.3),(3,3,'Specialty Drugs',82.3,7.3,14.2),(3,3,'Behavioral Health',34.6,4.5,6.0),(3,3,'Other',58.1,2.9,10.0),
(4,4,'Inpatient / Hospital',84.1,-3.2,15.6),(4,4,'Emergency Room',34.2,-2.8,6.4),(4,4,'Professional / Office Visits',96.7,2.4,18.0),(4,4,'Referral & Specialty',163.8,9.6,30.4),(4,4,'Specialty Drugs',66.5,3.4,12.4),(4,4,'Behavioral Health',28.5,2.1,5.3),(4,4,'Other',64.2,5.0,11.9),
(5,5,'Inpatient / Hospital',101.2,-15.3,18.3),(5,5,'Emergency Room',43.9,-12.1,8.0),(5,5,'Professional / Office Visits',112.6,7.4,20.4),(5,5,'Referral & Specialty',141.6,-5.7,25.7),(5,5,'Specialty Drugs',86.5,9.8,15.7),(5,5,'Behavioral Health',32.4,4.8,5.9),(5,5,'Other',33.8,-4.1,6.1)
)
INSERT INTO cost_summary (provider_id, contract_id, reporting_period, measurement_window, cost_category, total_cost, pmpm, yoy_delta_pmpm, yoy_delta_percent, percent_of_total_cost)
SELECT provider_id, contract_id, '2025-12-31', 'R12', category, ROUND(pmpm * 12 * CASE provider_id WHEN 1 THEN 1080 WHEN 2 THEN 760 WHEN 3 THEN 1320 WHEN 4 THEN 1020 ELSE 1580 END, 2), pmpm, ROUND(pmpm*yoy_delta_percent/100.0,2), yoy_delta_percent, pct_total
FROM cs;

-- care gaps
INSERT INTO care_gaps (member_id, provider_id, contract_id, measure_name, gap_status, eligible_flag, gap_open_date, estimated_dollar_impact, priority_flag) VALUES
(7,2,2,'AWV Completion Rate (%)','open',TRUE,'2025-04-01',850,'High'),(8,2,2,'Diabetes: A1c Control (<8%) Rate','open',TRUE,'2025-05-15',1200,'High'),(11,2,2,'Colorectal Cancer Screening Rate','open',TRUE,'2025-03-10',650,'Medium'),
(13,3,3,'30-Day Post-Discharge Follow-Up','open',TRUE,'2025-11-18',2200,'High'),(14,3,3,'Medication Adherence: Hypertension (%)','open',TRUE,'2025-07-01',900,'High'),(18,3,3,'AWV Completion Rate (%)','open',TRUE,'2025-02-20',850,'Medium'),
(20,4,4,'Breast Cancer Screening Rate (40–74)','open',TRUE,'2025-06-11',700,'Medium'),(23,4,4,'Diabetes: A1c Testing (Annual) Rate','open',TRUE,'2025-08-05',750,'Medium'),
(25,5,5,'Diabetes: A1c Control (<8%) Rate','open',TRUE,'2025-04-12',1200,'High'),(28,5,5,'30-Day Post-Discharge Follow-Up','open',TRUE,'2025-12-01',2500,'High'),(30,5,5,'CKD Monitoring','open',TRUE,'2025-06-24',1100,'High');

-- access events few demo rows
INSERT INTO access_events (provider_id, member_id, event_date, event_type, appointment_wait_days, visit_completed_flag, source_system) VALUES
(1,1,'2025-10-02','AWV',4,TRUE,'EHR'),(1,3,'2025-11-14','Telehealth',2,TRUE,'EHR'),(2,7,'2025-12-08','PCP Visit',12,TRUE,'EHR'),(2,8,'2025-12-10','PCP Visit',11,TRUE,'EHR'),(3,13,'2025-11-25','Post-Discharge Visit',7,TRUE,'EHR'),(4,20,'2025-12-04','Preventive Visit',8,TRUE,'EHR'),(5,25,'2025-12-07','AWV',6,TRUE,'EHR'),(5,28,'2025-12-12','Post-Discharge Visit',5,TRUE,'EHR');

INSERT INTO hospital_events (member_id, provider_id, contract_id, event_type, admit_date, discharge_date, facility_name, primary_dx, drg, los_days, allowed_cost, avoidable_er_flag, readmission_flag, readmission_risk, tcm_referral_sent_flag, care_management_enrolled_flag) VALUES
(2,1,1,'inpatient','2025-07-11','2025-07-15','Wichita Regional Medical Center','CHF exacerbation','292',4,28600,FALSE,FALSE,'Medium',TRUE,TRUE),
(8,2,2,'ER','2025-10-22','2025-10-22','West Wichita Community Hospital','Dehydration','N/A',0,2100,TRUE,FALSE,'Low',FALSE,FALSE),
(13,3,3,'inpatient','2025-11-12','2025-11-19','Wichita Regional Medical Center','Sepsis','871',7,58500,FALSE,TRUE,'High',FALSE,FALSE),
(14,3,3,'inpatient','2025-09-04','2025-09-11','St. Catherine Medical Center','COPD exacerbation','190',7,44200,FALSE,TRUE,'High',TRUE,TRUE),
(18,3,3,'ER','2025-12-02','2025-12-02','Wichita Regional Medical Center','Chest pain','N/A',0,3200,TRUE,FALSE,'Medium',FALSE,FALSE),
(23,4,4,'observation','2025-08-18','2025-08-19','Riverside Surgical Hospital','Syncope','312',1,8400,FALSE,FALSE,'Low',TRUE,FALSE),
(25,5,5,'inpatient','2025-10-15','2025-10-21','South Wichita Medical Center','Acute kidney injury','682',6,46200,FALSE,FALSE,'High',TRUE,TRUE),
(28,5,5,'inpatient','2025-11-26','2025-12-04','Wichita Regional Medical Center','CHF exacerbation','292',8,63800,FALSE,TRUE,'High',FALSE,FALSE),
(30,5,5,'ER','2025-09-17','2025-09-17','South Wichita Medical Center','Uncontrolled diabetes','N/A',0,2800,TRUE,FALSE,'Medium',FALSE,TRUE);

INSERT INTO specialists (specialist_name, npi, specialty, group_name, network_status, market, state) VALUES
('Wichita Heart Consultants', '1834567901', 'Cardiology', 'Wichita Heart Consultants', 'INN', 'Wichita', 'KS'),
('Kansas Orthopedic & Spine Center', '1834567902', 'Orthopedics / MSK', 'Kansas Orthopedic & Spine Center', 'OON', 'Wichita', 'KS'),
('ICT Neurology Associates', '1834567903', 'Neurology', 'ICT Neurology Associates', 'OON', 'Wichita', 'KS'),
('River City Endocrinology', '1834567904', 'Endocrinology', 'River City Endocrinology', 'INN', 'Wichita', 'KS'),
('Prairie Imaging Partners', '1834567905', 'Imaging', 'Prairie Imaging Partners', 'OON', 'Wichita', 'KS'),
('South Central Behavioral Health', '1834567906', 'Mental Health / Psychiatry', 'South Central Behavioral Health', 'INN', 'Wichita', 'KS');

INSERT INTO referral_events (member_id, referring_provider_id, specialist_provider_id, contract_id, referral_date, specialty, inn_oon_flag, referral_reason, allowed_cost, imaging_cost, lab_diagnostic_cost, steerage_opportunity_flag) VALUES
(2,1,1,1,'2025-07-21','Cardiology','INN','CHF follow-up',420,0,0,FALSE),
(8,2,4,2,'2025-09-03','Endocrinology','INN','Uncontrolled diabetes',380,0,110,FALSE),
(13,3,1,3,'2025-11-22','Cardiology','INN','Post-sepsis cardiac evaluation',460,0,0,FALSE),
(20,4,2,4,'2025-08-03','Orthopedics / MSK','OON','Knee pain',2250,950,0,TRUE),
(23,4,5,4,'2025-09-16','Imaging','OON','Lumbar MRI',1850,1850,0,TRUE),
(24,4,3,4,'2025-10-12','Neurology','OON','Headache evaluation',1650,600,140,TRUE),
(25,5,4,5,'2025-10-27','Endocrinology','INN','Diabetes management',410,0,120,FALSE),
(28,5,1,5,'2025-12-08','Cardiology','INN','CHF follow-up',450,0,0,FALSE),
(30,5,5,5,'2025-09-20','Imaging','OON','Renal ultrasound',980,980,0,TRUE);

INSERT INTO specialist_performance (specialist_id, contract_id, reporting_period, r12_referrals, unique_members, r12_total_cost, avg_cost_per_visit, specialty_peer_avg_cost, vs_peer_amount, vs_peer_percent, outlier_flag, steerage_opportunity) VALUES
(1,1,'2025-12-31',42,36,18400,438,455,-17,-3.74,'No','Low'),
(4,2,'2025-12-31',31,27,12800,413,390,23,5.90,'Watch','Medium'),
(1,3,'2025-12-31',58,48,28600,493,455,38,8.35,'Watch','Medium'),
(2,4,'2025-12-31',64,51,168000,2625,1420,1205,84.86,'Yes','High'),
(3,4,'2025-12-31',28,23,49600,1771,1040,731,70.29,'Yes','High'),
(5,4,'2025-12-31',92,80,154000,1674,980,694,70.82,'Yes','High'),
(4,5,'2025-12-31',47,39,20100,428,390,38,9.74,'Watch','Medium'),
(5,5,'2025-12-31',55,49,72600,1320,980,340,34.69,'Yes','High');

INSERT INTO cost_cap_summary (provider_id, contract_id, reporting_period, measurement_window, cost_cap_threshold, members_with_capped_costs, total_actual_allowed_cost_capped_members, total_cap_amount_applied, total_dollars_excluded, uncapped_panel_pmpm, capped_panel_pmpm, pmpm_impact, domains_affected) VALUES
(1,1,'2025-12-31','R12',75000,1,96500,75000,21500,492.4,486.0,6.4,'Hospital Costs; Referral & Specialty Costs'),
(2,2,'2025-12-31','R12',75000,1,80400,75000,5400,516.8,515.0,1.8,'Hospital Costs'),
(3,3,'2025-12-31','R12',75000,3,319000,225000,94000,601.7,578.0,23.7,'Hospital Costs; Referral & Specialty Costs'),
(4,4,'2025-12-31','R12',75000,1,121000,75000,46000,550.6,538.0,12.6,'Referral & Specialty Costs'),
(5,5,'2025-12-31','R12',75000,4,436000,300000,136000,585.0,552.0,33.0,'Hospital Costs; Referral & Specialty Costs');

INSERT INTO cost_cap_member_detail (member_id, provider_id, contract_id, reporting_period, r12_actual_allowed_cost, cap_threshold, cap_applied_flag, amount_excluded, hospital_cost_excluded, referral_cost_excluded, months_in_r12_window, care_management_enrolled_flag, notes) VALUES
(6,1,1,'2025-12-31',96500,75000,TRUE,21500,16000,5500,12,TRUE,'Synthetic outlier cap applied'),
(11,2,2,'2025-12-31',80400,75000,TRUE,5400,5400,0,12,FALSE,'Synthetic outlier cap applied'),
(13,3,3,'2025-12-31',118000,75000,TRUE,43000,38000,5000,12,FALSE,'Synthetic outlier cap applied'),
(14,3,3,'2025-12-31',95000,75000,TRUE,20000,20000,0,12,TRUE,'Synthetic outlier cap applied'),
(18,3,3,'2025-12-31',106000,75000,TRUE,31000,22000,9000,12,FALSE,'Synthetic outlier cap applied'),
(23,4,4,'2025-12-31',121000,75000,TRUE,46000,4000,42000,12,FALSE,'Synthetic referral-cost outlier cap applied'),
(25,5,5,'2025-12-31',104000,75000,TRUE,29000,24000,5000,12,TRUE,'Synthetic outlier cap applied'),
(28,5,5,'2025-12-31',146000,75000,TRUE,71000,62000,9000,12,FALSE,'Synthetic outlier cap applied'),
(30,5,5,'2025-12-31',86000,75000,TRUE,11000,6000,5000,12,TRUE,'Synthetic outlier cap applied'),
(26,5,5,'2025-12-31',100000,75000,TRUE,25000,18000,7000,12,FALSE,'Synthetic outlier cap applied');

INSERT INTO action_tasks (organization_id, provider_id, member_id, task_type, priority, title, description, recommended_action, estimated_dollar_impact, assigned_to, status, due_date) VALUES
(2,2,7,'access','High','Close overdue AWV gap','Member is overdue for AWV and has no completed preventive visit in R12.','Schedule AWV within 30 days and review preventive gaps.',850,4,'open','2026-01-20'),
(2,2,8,'quality','High','Improve diabetes control','A1c control gap open with recent ER utilization.','Schedule diabetes follow-up and medication review.',1200,4,'in_progress','2026-01-18'),
(3,3,13,'hospital','High','Post-discharge high readmission risk','Recent inpatient event with high readmission risk and no CM enrollment.','Complete TCM outreach and enroll in care management.',2200,6,'open','2026-01-10'),
(3,3,14,'hospital','High','Readmission prevention follow-up','COPD admission and readmission flag.','Complete pulmonary follow-up and medication reconciliation.',1800,6,'in_progress','2026-01-12'),
(4,4,20,'referral','High','OON ortho steerage opportunity','OON orthopedic referral with high cost versus peer.','Redirect future MSK referrals to preferred INN orthopedic group.',3200,9,'open','2026-01-25'),
(4,4,23,'referral','High','Imaging leakage review','OON imaging event above network peer cost.','Route future imaging to preferred INN imaging vendor.',2100,8,'open','2026-01-22'),
(5,5,25,'quality','High','Diabetes and CKD risk review','High-risk member with open diabetes control gap.','Schedule PCP/endocrinology review and update care plan.',1200,12,'open','2026-01-17'),
(5,5,28,'hospital','High','Urgent TCM after CHF admission','Recent discharge, high predicted admit probability, not enrolled in CM.','Complete TCM call and enroll in CHF care pathway.',2500,12,'open','2026-01-08'),
(1,1,2,'hospital','Medium','CHF follow-up maintenance','Recent CHF admission but TCM completed.','Confirm cardiology follow-up and medication adherence.',900,3,'completed','2026-01-05');

INSERT INTO outreach_log (task_id, member_id, outreach_date, outreach_method, outcome, next_step, staff_name) VALUES
(2,8,'2026-01-04','phone','Reached member','PCP appointment scheduled for 2026-01-15','Eric Hamilton'),
(4,14,'2026-01-03','phone','Left voicemail','Retry in 2 business days','Darius Reed'),
(9,2,'2026-01-02','portal','Message acknowledged','Monitor follow-up completion','Lena Owens');

INSERT INTO version_log (version, release_date, change_type, module_name, summary, before_value, after_value, changed_by, approved_by, user_impact) VALUES
('0.1.0','2025-12-15','ui_release','Performance Command Center','Initial MVP dashboard release',NULL,'Executive scorecard available','Product Team','Demo Sponsor','Medium'),
('0.1.1','2025-12-22','benchmark_change','Benchmarks Trust Center','Loaded 2025 Wichita synthetic benchmarks','Draft benchmarks','2025 active benchmarks','Analytics Team','Product Team','Medium'),
('0.1.2','2025-12-31','data_refresh','All Modules','Loaded Dec-25 report and Jan-25 through Dec-25 R12 data','Nov-25 report','Dec-25 report','Data Ops','Analytics Lead','High');

INSERT INTO data_refresh_log (refresh_date, data_source, period_loaded, records_processed, status, validation_result, notes) VALUES
('2025-12-31','synthetic_mvp_seed','Jan-25 through Dec-25',12450,'success','passed','Synthetic demo data loaded for Wichita provider groups.'),
('2025-12-31','synthetic_member_actions','Dec-25',84,'success','passed','Member-level action queue generated.'),
('2025-12-31','synthetic_benchmarks','2025 R12',96,'success','passed','Benchmark configuration loaded.');

CREATE INDEX idx_provider_metric_results_provider_period ON provider_metric_results(provider_id, reporting_period);
CREATE INDEX idx_domain_scores_provider_period ON domain_scores(provider_id, reporting_period);
CREATE INDEX idx_members_org_provider ON members(organization_id, primary_provider_id);
CREATE INDEX idx_action_tasks_org_status ON action_tasks(organization_id, status);
CREATE INDEX idx_hospital_events_provider_dates ON hospital_events(provider_id, admit_date);
CREATE INDEX idx_referral_events_provider_dates ON referral_events(referring_provider_id, referral_date);

-- helpful summary query:
-- SELECT o.organization_name, SUM(ds.available_amount) available, SUM(ds.earned_amount) earned, SUM(ds.missed_amount) missed, ROUND(SUM(ds.earned_amount)/SUM(ds.available_amount)*100,1) capture_rate
-- FROM organizations o JOIN providers p ON p.organization_id=o.id JOIN domain_scores ds ON ds.provider_id=p.id
-- GROUP BY o.organization_name ORDER BY capture_rate DESC;