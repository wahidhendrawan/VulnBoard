export type Control = {
  id: string;
  title: string;
  description: string;
  category?: string;
};

export type Framework = {
  id: string;
  name: string;
  version?: string;
  description: string;
  controls: Control[];
};

export const frameworks: Framework[] = [
  {
    id: "owasp_top10_2021",
    name: "OWASP Top 10",
    version: "2021",
    description: "OWASP Top 10 2021 Web Application Security Risks",
    controls: [
      {
        id: "A01",
        title: "Broken Access Control",
        description: "Common access control issues allowing unauthorized actions"
      },
      {
        id: "A02",
        title: "Cryptographic Failures",
        description: "Weak or missing encryption and poor key management"
      },
      {
        id: "A03",
        title: "Injection",
        description: "SQL Injection, OS Command Injection, etc."
      }
    ]
  },
  {
    id: "pci_dss_4",
    name: "PCI DSS",
    version: "4.0",
    description: "Payment Card Industry Data Security Standard v4.0",
    controls: [
      {
        id: "1.1",
        title: "Install and maintain network security controls",
        description: "Basic firewall and network segmentation controls"
      },
      {
        id: "6.2",
        title: "Ensure all system components and software are protected",
        description: "Patch management and secure software maintenance"
      }
    ]
  }
];
