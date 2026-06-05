export type Control = { id: string; title: string; description: string; category?: string; };
export type Framework = { id: string; name: string; version?: string; description: string; controls: Control[]; };

export const frameworks: Framework[] = [
  {
    id: "owasp_top10_2021",
    name: "OWASP Top 10",
    version: "2021",
    description: "OWASP Top 10 2021 Web Application Security Risks",
    controls: [
      { id: "A01", title: "Broken Access Control", description: "Moving up from #5, access control failures allow users to act outside their intended permissions, leading to unauthorized data access, modification, or destruction." },
      { id: "A02", title: "Cryptographic Failures", description: "Failures related to cryptography (or lack thereof) that expose sensitive data, including weak algorithms, poor key management, and missing encryption in transit or at rest." },
      { id: "A03", title: "Injection", description: "Injection flaws such as SQL, NoSQL, OS, and LDAP injection occur when untrusted data is sent to an interpreter as part of a command or query." },
      { id: "A04", title: "Insecure Design", description: "A new category focusing on risks related to design and architectural flaws, emphasizing the need for threat modeling and secure design patterns." },
      { id: "A05", title: "Security Misconfiguration", description: "The most common issue. Insecure defaults, incomplete configurations, open cloud storage, verbose error messages, and missing security hardening." },
      { id: "A06", title: "Vulnerable and Outdated Components", description: "Using components with known vulnerabilities such as libraries, frameworks, and other software modules that run with the same privileges as the application." },
      { id: "A07", title: "Identification and Authentication Failures", description: "Weaknesses in authentication and session management that allow attackers to compromise passwords, keys, or session tokens, or to exploit other implementation flaws." },
      { id: "A08", title: "Software and Data Integrity Failures", description: "A new category focusing on making assumptions related to software updates, critical data, and CI/CD pipelines without verifying integrity, including insecure deserialization." },
      { id: "A09", title: "Security Logging and Monitoring Failures", description: "Without sufficient logging and monitoring, breaches cannot be detected. This includes missing audit logs, unclear logs, and lack of active monitoring or alerting." },
      { id: "A10", title: "Server-Side Request Forgery (SSRF)", description: "SSRF flaws occur when a web application fetches a remote resource without validating the user-supplied URL, allowing attackers to make the server issue requests to unintended destinations." },
    ]
  },
  {
    id: "nist_csf_2",
    name: "NIST CSF",
    version: "2.0",
    description: "NIST Cybersecurity Framework 2.0 — six core functions for managing cybersecurity risk",
    controls: [
      // GOVERN
      { id: "GV.OC-01", title: "Organizational Context", description: "The organizational mission is understood and informs cybersecurity risk management.", category: "Govern" },
      { id: "GV.RM-01", title: "Risk Management Strategy", description: "Risk management objectives are established and agreed to by organizational stakeholders.", category: "Govern" },
      { id: "GV.RR-01", title: "Roles & Responsibilities", description: "Organizational leadership is responsible and accountable for cybersecurity risk.", category: "Govern" },
      { id: "GV.PO-01", title: "Policy", description: "Cybersecurity policy is established, communicated, and enforced.", category: "Govern" },
      { id: "GV.SC-01", title: "Supply Chain Risk Management", description: "A cybersecurity supply chain risk management program is established.", category: "Govern" },
      // IDENTIFY
      { id: "ID.AM-01", title: "Asset Management — Inventory", description: "Inventories of hardware and software assets are maintained.", category: "Identify" },
      { id: "ID.AM-02", title: "Asset Management — Software", description: "Inventories of software, services, and SaaS are maintained.", category: "Identify" },
      { id: "ID.RA-01", title: "Risk Assessment — Vulnerabilities", description: "Vulnerabilities in assets are identified, validated, and recorded.", category: "Identify" },
      { id: "ID.RA-02", title: "Risk Assessment — Intelligence", description: "Cyber threat intelligence is received from information sharing forums.", category: "Identify" },
      { id: "ID.IM-01", title: "Improvement", description: "Improvements are identified from security assessments and lessons learned.", category: "Identify" },
      // PROTECT
      { id: "PR.AA-01", title: "Identity Management & Access Control", description: "Identities and credentials for authorized users, services, and hardware are managed.", category: "Protect" },
      { id: "PR.AT-01", title: "Awareness & Training", description: "Personnel are provided awareness and training so they can perform cybersecurity tasks.", category: "Protect" },
      { id: "PR.DS-01", title: "Data Security — At Rest", description: "The confidentiality, integrity, and availability of data-at-rest are protected.", category: "Protect" },
      { id: "PR.DS-02", title: "Data Security — In Transit", description: "The confidentiality, integrity, and availability of data-in-transit are protected.", category: "Protect" },
      { id: "PR.PS-01", title: "Platform Security", description: "Configuration management practices are established and applied.", category: "Protect" },
      { id: "PR.IR-01", title: "Technology Infrastructure Resilience", description: "Networks and environments are protected from unauthorized logical access and usage.", category: "Protect" },
      // DETECT
      { id: "DE.CM-01", title: "Continuous Monitoring — Network", description: "Networks and network services are monitored to find potentially adverse events.", category: "Detect" },
      { id: "DE.CM-03", title: "Continuous Monitoring — Personnel", description: "Personnel activity and technology usage are monitored to find potentially adverse events.", category: "Detect" },
      { id: "DE.CM-09", title: "Continuous Monitoring — Computing Hardware", description: "Computing hardware and software are monitored to find potentially adverse events.", category: "Detect" },
      { id: "DE.AE-02", title: "Adverse Event Analysis", description: "Potentially adverse events are analyzed to better characterize them.", category: "Detect" },
      { id: "DE.AE-06", title: "Incident Declaration", description: "Information on adverse events is provided to authorized staff and tools.", category: "Detect" },
      // RESPOND
      { id: "RS.MA-01", title: "Incident Management", description: "The incident response plan is executed in coordination with relevant third parties.", category: "Respond" },
      { id: "RS.AN-03", title: "Incident Analysis", description: "Analysis is performed to establish what has taken place during an incident.", category: "Respond" },
      { id: "RS.CO-02", title: "Incident Response Reporting", description: "Internal and external stakeholders are notified of incidents.", category: "Respond" },
      { id: "RS.MI-01", title: "Incident Mitigation", description: "Incidents are contained to reduce impact.", category: "Respond" },
      // RECOVER
      { id: "RC.RP-01", title: "Incident Recovery Plan", description: "The recovery portion of the incident response plan is executed.", category: "Recover" },
      { id: "RC.CO-03", title: "Recovery Communication", description: "Recovery activities are communicated to internal and external stakeholders.", category: "Recover" },
      { id: "RC.RP-05", title: "Restoration", description: "The integrity of restored assets is verified, systems and services are restored.", category: "Recover" },
    ]
  },
  {
    id: "iso27001_2022",
    name: "ISO/IEC 27001",
    version: "2022",
    description: "ISO/IEC 27001:2022 Information Security Management System — Annex A controls",
    controls: [
      // Organizational
      { id: "5.1",  title: "Policies for Information Security", description: "Information security policy and topic-specific policies are defined, approved, published, and communicated.", category: "Organizational" },
      { id: "5.2",  title: "Information Security Roles and Responsibilities", description: "Roles and responsibilities for information security are defined and allocated.", category: "Organizational" },
      { id: "5.7",  title: "Threat Intelligence", description: "Information relating to information security threats is collected, analysed, and acted upon.", category: "Organizational" },
      { id: "5.8",  title: "Information Security in Project Management", description: "Information security is integrated into project management throughout the project lifecycle.", category: "Organizational" },
      { id: "5.10", title: "Acceptable Use of Information and Assets", description: "Rules for the acceptable use and handling of information and other associated assets are documented and enforced.", category: "Organizational" },
      { id: "5.15", title: "Access Control", description: "Rules to control physical and logical access to information and other associated assets are established and implemented.", category: "Organizational" },
      { id: "5.16", title: "Identity Management", description: "The full life cycle of identities is managed.", category: "Organizational" },
      { id: "5.17", title: "Authentication Information", description: "Allocation and management of authentication information is controlled by a management process.", category: "Organizational" },
      { id: "5.23", title: "Information Security for Use of Cloud Services", description: "Processes for acquisition, use, management, and exit from cloud services are established.", category: "Organizational" },
      { id: "5.29", title: "Information Security During Disruption", description: "The organization plans how to maintain information security at an appropriate level during disruption.", category: "Organizational" },
      { id: "5.36", title: "Compliance with Security Policies and Standards", description: "Compliance with information security policies, standards, and technical standards is reviewed regularly.", category: "Organizational" },
      // People
      { id: "6.1",  title: "Screening", description: "Background verification checks on all candidates for employment are carried out.", category: "People" },
      { id: "6.3",  title: "Information Security Awareness, Education and Training", description: "Personnel and relevant interested parties receive appropriate information security awareness, education and training.", category: "People" },
      { id: "6.4",  title: "Disciplinary Process", description: "A formal disciplinary process exists and is communicated to address personnel who commit information security violations.", category: "People" },
      { id: "6.8",  title: "Information Security Event Reporting", description: "A mechanism exists for personnel to report observed or suspected information security events.", category: "People" },
      // Physical
      { id: "7.1",  title: "Physical Security Perimeters", description: "Security perimeters are defined and used to protect areas that contain information and other associated assets.", category: "Physical" },
      { id: "7.4",  title: "Physical Security Monitoring", description: "Premises are continuously monitored for unauthorized physical access.", category: "Physical" },
      { id: "7.6",  title: "Working in Secure Areas", description: "Security measures for working in secure areas are designed and implemented.", category: "Physical" },
      { id: "7.9",  title: "Security of Assets Off-Premises", description: "Off-site assets are protected.", category: "Physical" },
      // Technological
      { id: "8.2",  title: "Privileged Access Rights", description: "The allocation and use of privileged access rights are restricted and managed.", category: "Technological" },
      { id: "8.4",  title: "Access to Source Code", description: "Read and write access to source code, development tools, and software libraries are appropriately managed.", category: "Technological" },
      { id: "8.7",  title: "Protection Against Malware", description: "Protection against malware is implemented and supported by appropriate user awareness.", category: "Technological" },
      { id: "8.8",  title: "Management of Technical Vulnerabilities", description: "Information about technical vulnerabilities of systems is obtained, and appropriate measures are taken.", category: "Technological" },
      { id: "8.9",  title: "Configuration Management", description: "Configurations, including security configurations, of hardware, software, services, and networks are established, documented, implemented, monitored, and reviewed.", category: "Technological" },
      { id: "8.11", title: "Data Masking", description: "Data masking is used in accordance with the organization's topic-specific policy on access control.", category: "Technological" },
      { id: "8.12", title: "Data Leakage Prevention", description: "Data leakage prevention measures are applied to systems, networks, and other devices that process, store, or transmit sensitive information.", category: "Technological" },
      { id: "8.16", title: "Monitoring Activities", description: "Networks, systems, and applications are monitored for anomalous behaviour and appropriate actions are taken.", category: "Technological" },
      { id: "8.25", title: "Secure Development Life Cycle", description: "Rules for the secure development of software and systems are established and applied.", category: "Technological" },
      { id: "8.28", title: "Secure Coding", description: "Secure coding principles are applied to software development.", category: "Technological" },
    ]
  },
  {
    id: "pci_dss_4",
    name: "PCI DSS",
    version: "4.0",
    description: "Payment Card Industry Data Security Standard v4.0 — 12 core requirements",
    controls: [
      { id: "REQ-1",  title: "Install and Maintain Network Security Controls", description: "Network security controls (NSCs) are installed and maintained to protect the cardholder data environment (CDE)." },
      { id: "REQ-2",  title: "Apply Secure Configurations to All System Components", description: "Malicious actors often use default passwords and other vendor default settings to compromise systems. Secure configurations must be applied." },
      { id: "REQ-3",  title: "Protect Stored Account Data", description: "Protection methods such as encryption, truncation, masking, and hashing are critical to rendering stored account data unreadable." },
      { id: "REQ-4",  title: "Protect Cardholder Data with Strong Cryptography During Transmission", description: "Use strong cryptography to safeguard PAN during transmission over open, public networks." },
      { id: "REQ-5",  title: "Protect All Systems and Networks from Malicious Software", description: "Malicious software (malware) exploits system vulnerabilities. Anti-malware solutions must be deployed and maintained." },
      { id: "REQ-6",  title: "Develop and Maintain Secure Systems and Software", description: "Unscrupulous individuals use security vulnerabilities to gain privileged access to systems. Secure development practices and patch management are required." },
      { id: "REQ-7",  title: "Restrict Access to System Components and Cardholder Data by Business Need to Know", description: "Access to system components and cardholder data is limited to those individuals whose job requires such access." },
      { id: "REQ-8",  title: "Identify Users and Authenticate Access to System Components", description: "Authentication policies and procedures ensure user identity is established and credentials are protected." },
      { id: "REQ-9",  title: "Restrict Physical Access to Cardholder Data", description: "Physical access to cardholder data or systems housing cardholder data can allow unauthorized persons to access devices or data." },
      { id: "REQ-10", title: "Log and Monitor All Access to System Components and Cardholder Data", description: "Logging mechanisms enable the tracking, alerting, and analysis of when something goes wrong." },
      { id: "REQ-11", title: "Test Security of Systems and Networks Regularly", description: "Vulnerabilities are continuously being discovered. Systems, processes, and software need to be tested frequently." },
      { id: "REQ-12", title: "Support Information Security with Organizational Policies and Programs", description: "A strong security policy sets the security tone for the whole entity and informs personnel what is expected of them." },
    ]
  },
  {
    id: "sans_top25_cwe",
    name: "SANS/CWE Top 25",
    version: "2023",
    description: "SANS/MITRE CWE Top 25 Most Dangerous Software Weaknesses (top 10 selected)",
    controls: [
      { id: "CWE-787", title: "Out-of-bounds Write", description: "The software writes data past the end, or before the beginning, of the intended buffer, leading to data corruption, crashes, or arbitrary code execution." },
      { id: "CWE-79",  title: "Improper Neutralization of Input During Web Page Generation (XSS)", description: "The software does not neutralize user-controllable input before placing it in output that is used as a web page served to users." },
      { id: "CWE-89",  title: "SQL Injection", description: "The software constructs all or part of an SQL command using externally-influenced input, allowing attackers to modify the SQL query." },
      { id: "CWE-416", title: "Use After Free", description: "Referencing memory after it has been freed can cause a program to crash, use unexpected values, or execute arbitrary code." },
      { id: "CWE-78",  title: "OS Command Injection", description: "The software constructs all or part of an OS command using externally-influenced input without sufficient neutralization." },
      { id: "CWE-20",  title: "Improper Input Validation", description: "The product does not validate or incorrectly validates input that can affect the control flow or data flow of a program." },
      { id: "CWE-125", title: "Out-of-bounds Read", description: "The software reads data past the end, or before the beginning, of the intended buffer, leading to information exposure or crashes." },
      { id: "CWE-22",  title: "Path Traversal", description: "The software uses external input to construct a pathname intended to identify a file, but does not neutralize sequences that can resolve outside the intended directory." },
      { id: "CWE-352", title: "Cross-Site Request Forgery (CSRF)", description: "The web application does not adequately verify that a request was intentionally sent by the user who submitted it." },
      { id: "CWE-434", title: "Unrestricted Upload of File with Dangerous Type", description: "The software allows the attacker to upload or transfer files of dangerous types that can be automatically processed within the product's environment." },
    ]
  },
];
