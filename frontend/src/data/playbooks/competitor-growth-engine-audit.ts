import { Playbook } from './types';

export const competitorGrowthEngineAudit: Playbook = {
  id: 'competitor-growth-engine-audit',
  title: 'Competitor SEO Growth Engine Audit',
  description: 'TOP-TIER Professional SEO competitive intelligence report with 20+ data sources per fluctuation, technical SEO audit, user behavior analysis, growth strategy replication playbook, and executive-ready insights. Automated HTML+DOCX with interactive charts.',
  category: 'research',
  agentName: 'Competitor SEO Growth Analyst',
  autoActions: [
    'Batch fetch SEO data for all domains (competitors + your domain)',
    'Get multi-channel traffic distribution (Organic, Direct, Referral, Social)',
    'Analyze 12-month historical trends, detect traffic fluctuations (>15% MoM)',
    'Get Top 50 traffic pages, identify PSEO patterns',
    'Analyze Top 20 keyword strategies, compare all domains',
    'Analyze backlink data (referring domains, authority score)',
    'Find hot tracks and get leading product data as traffic benchmarks',
    'Execute keyword gap analysis (find keywords competitors rank for but you don\'t)',
    'If traffic fluctuations detected, execute deep root cause investigation',
    'Generate interactive HTML report and Word document'
  ],
  outputs: [
    'SEO traffic overview comparison table (all domains)',
    'Multi-channel traffic distribution table',
    '12-month traffic trend charts',
    'Traffic fluctuation root cause analysis (with evidence citations)',
    'Top 50 traffic pages comparison analysis',
    'Top 20 keyword strategy comparison analysis',
    'Backlink data evaluation (all domains)',
    'Track popularity benchmarking analysis (reference dimension)',
    'Keyword gap analysis (if my_domain provided)',
    'Interactive HTML report',
    'Word document report'
  ],
  complexity: 'hard',
  tags: ['seo', 'competitor', 'growth-engine', 'traffic-analysis', '24-month-trends', 'root-cause', 'benchmark', 'semrush'],
  options: [
    { 
      label: 'Start Full Analysis', 
      value: 'full',
      formFields: [
        {
          name: 'competitor_domains',
          label: 'Competitor Domains',
          type: 'multi-text',
          placeholder: 'Enter domain, e.g.: competitor1.com',
          required: true,
          description: 'Enter at least 1 competitor domain. Press Enter or click Add after each entry. Recommend 3-5 domains for better comparative analysis.'
        },
        {
          name: 'my_domain',
          label: 'My Domain (Optional)',
          type: 'text',
          placeholder: 'yourdomain.com',
          required: false,
          description: 'Enter your domain if you need keyword gap analysis'
        },
        {
          name: 'primary_market',
          label: 'Target Market',
          type: 'select',
          required: true,
          defaultValue: 'us',
          options: [
            { label: 'United States (US) - Most complete data', value: 'us' },
            { label: 'United Kingdom (UK)', value: 'uk' },
            { label: 'Canada (CA)', value: 'ca' },
            { label: 'Australia (AU)', value: 'au' },
            { label: 'Germany (DE)', value: 'de' },
            { label: 'France (FR)', value: 'fr' },
            { label: 'Japan (JP)', value: 'jp' },
          ],
          description: 'Select the market/country to analyze'
        },
      ]
    }
  ]
};
