/**
 * Healthcare Extension Example
 *
 * Demonstrates proper use of SDK extension patterns for healthcare operations.
 *
 * Features:
 * - Patient records search (HIPAA-aware)
 * - Clinical decision support
 * - Appointment scheduling
 * - Lab results analysis
 *
 * This extension shows:
 * - ToolBuilder with sensitive data handling
 * - Using ctx.brain.search() for clinical knowledge
 * - Using ctx.integrations.get() for EHR credentials
 * - HIPAA-compliant logging patterns
 * - ExtensionBundle for packaging
 * - createHandler for deployment
 *
 * IMPORTANT: This is an example demonstrating extension patterns.
 * Real healthcare implementations require additional security,
 * compliance, and audit controls.
 */

import {
  ToolBuilder,
  IntegrationBuilder,
  CartridgeBuilder,
  ExtensionBundle,
  createHandler,
  z,
} from '@tribble/extensions';

// ==================== Tools ====================

/**
 * Search patient records with HIPAA-aware logging.
 * Uses brain for clinical terminology mapping.
 */
const searchPatientRecords = new ToolBuilder('health_search_patient_records')
  .description(
    'Search patient health records by patient ID, condition, or date range. Returns de-identified summary unless full access authorized.'
  )
  .parameters({
    patientId: z.string().describe('Patient MRN or identifier'),
    recordTypes: z
      .array(
        z.enum([
          'demographics',
          'encounters',
          'diagnoses',
          'medications',
          'labs',
          'vitals',
          'allergies',
          'immunizations',
        ])
      )
      .optional()
      .default(['encounters', 'diagnoses', 'medications'])
      .describe('Types of records to retrieve'),
    dateRange: z
      .object({
        start: z.string().describe('Start date (YYYY-MM-DD)'),
        end: z.string().describe('End date (YYYY-MM-DD)'),
      })
      .optional()
      .describe('Date range filter'),
    accessLevel: z
      .enum(['summary', 'full'])
      .optional()
      .default('summary')
      .describe('Access level - full requires additional authorization'),
  })
  .category('query')
  .timeout(30_000)
  .requiresIntegration('ehr_system')
  .handler(async (args, ctx) => {
    // HIPAA: Log access with minimal PHI
    ctx.logger.info('Patient record access', {
      patientId: hashPatientId(args.patientId),
      recordTypes: args.recordTypes,
      accessLevel: args.accessLevel,
      userId: ctx.userId,
    });

    // Search brain for clinical terminology
    const clinicalDocs = await ctx.brain.search(
      `clinical terminology ICD-10 SNOMED ${args.recordTypes.join(' ')}`,
      { limit: 5 }
    );

    // Get EHR credentials
    const creds = await ctx.integrations.get<{
      baseUrl: string;
      clientId: string;
      clientSecret: string;
    }>('ehr_system');

    // Fetch patient records (simulated)
    const records = await fetchPatientRecords(creds, args);

    // Apply access level filtering
    const filteredRecords =
      args.accessLevel === 'summary' ? summarizeRecords(records) : records;

    return {
      content: formatPatientRecords(filteredRecords, args.accessLevel),
      citations: clinicalDocs.slice(0, 3).map((doc) => ({
        title: doc.metadata?.documentLabel || 'Clinical Reference',
        snippet: doc.content.slice(0, 150),
      })),
      data: {
        recordCount: filteredRecords.length,
        recordTypes: args.recordTypes,
        accessLevel: args.accessLevel,
        // Never include PHI in data - only metadata
      },
      // Don't recurse on patient data to prevent data leakage
      stopRecursion: true,
    };
  })
  .build();

/**
 * Clinical decision support - analyze symptoms and suggest workup.
 * Uses brain for clinical guidelines and evidence-based protocols.
 */
const clinicalDecisionSupport = new ToolBuilder('health_clinical_decision_support')
  .description(
    'Provide clinical decision support for symptoms, diagnoses, or treatment planning. Returns evidence-based recommendations.'
  )
  .parameters({
    chiefComplaint: z.string().describe('Primary symptom or complaint'),
    symptoms: z
      .array(z.string())
      .optional()
      .describe('Additional symptoms'),
    patientContext: z
      .object({
        age: z.number().describe('Patient age'),
        sex: z.enum(['male', 'female', 'other']).describe('Patient sex'),
        relevantHistory: z.array(z.string()).optional().describe('Relevant medical history'),
      })
      .optional()
      .describe('Patient context for better recommendations'),
    requestType: z
      .enum(['differential', 'workup', 'treatment'])
      .optional()
      .default('differential')
      .describe('Type of clinical support requested'),
  })
  .category('compute')
  .timeout(45_000)
  .handler(async (args, ctx) => {
    ctx.logger.info('Clinical decision support requested', {
      chiefComplaint: args.chiefComplaint,
      requestType: args.requestType,
    });

    // Search brain for clinical guidelines
    const guidelineDocs = await ctx.brain.search(
      `clinical guidelines ${args.chiefComplaint} ${args.symptoms?.join(' ') || ''}`,
      { limit: 10 }
    );

    // Search for evidence-based protocols
    const protocolDocs = await ctx.brain.search(
      `evidence-based protocol ${args.requestType} ${args.chiefComplaint}`,
      { limit: 5 }
    );

    // Generate clinical recommendations
    const recommendations = generateClinicalRecommendations(args);

    return {
      content: formatClinicalSupport(recommendations, args.requestType),
      citations: [...guidelineDocs, ...protocolDocs].slice(0, 5).map((doc) => ({
        title: doc.metadata?.documentLabel || 'Clinical Guideline',
        snippet: doc.content.slice(0, 200),
        url: doc.metadata?.sourceIndex ? `guideline://${doc.metadata.sourceIndex}` : undefined,
      })),
      data: {
        requestType: args.requestType,
        recommendationCount: recommendations.items.length,
        confidenceLevel: recommendations.confidence,
      },
    };
  })
  .build();

/**
 * Schedule or find appointments.
 * Uses brain for provider availability rules and scheduling policies.
 */
const manageAppointments = new ToolBuilder('health_manage_appointments')
  .description(
    'Search for available appointments or schedule a new appointment. Returns available slots or confirmation.'
  )
  .parameters({
    action: z
      .enum(['search', 'book', 'cancel', 'reschedule'])
      .describe('Action to perform'),
    patientId: z.string().describe('Patient identifier'),
    providerId: z.string().optional().describe('Specific provider ID'),
    specialty: z.string().optional().describe('Medical specialty'),
    appointmentType: z
      .enum(['office', 'telehealth', 'procedure', 'followup'])
      .optional()
      .default('office')
      .describe('Type of appointment'),
    preferredDate: z.string().optional().describe('Preferred date (YYYY-MM-DD)'),
    appointmentId: z
      .string()
      .optional()
      .describe('Existing appointment ID (for cancel/reschedule)'),
  })
  .category('action')
  .timeout(30_000)
  .requiresIntegration('ehr_system')
  .handler(async (args, ctx) => {
    ctx.logger.info('Appointment action', {
      action: args.action,
      patientId: hashPatientId(args.patientId),
      appointmentType: args.appointmentType,
    });

    // Search brain for scheduling policies
    const policyDocs = await ctx.brain.search(
      `scheduling policy ${args.specialty || 'general'} ${args.appointmentType}`,
      { limit: 3 }
    );

    // Get EHR credentials
    const creds = await ctx.integrations.get<{
      baseUrl: string;
      clientId: string;
      clientSecret: string;
    }>('ehr_system');

    // Perform appointment action (simulated)
    const result = await performAppointmentAction(creds, args);

    return {
      content: formatAppointmentResult(result, args.action),
      citations: policyDocs.map((doc) => ({
        title: doc.metadata?.documentLabel || 'Scheduling Policy',
        snippet: doc.content.slice(0, 150),
      })),
      data: {
        action: args.action,
        success: result.success,
        appointmentId: result.appointmentId,
      },
    };
  })
  .build();

/**
 * Analyze lab results with reference to normal ranges.
 * Uses brain for lab interpretation guidelines.
 */
const analyzeLabResults = new ToolBuilder('health_analyze_labs')
  .description(
    'Analyze laboratory results with clinical interpretation. Highlights abnormal values and suggests follow-up.'
  )
  .parameters({
    patientId: z.string().describe('Patient identifier'),
    labOrderId: z.string().optional().describe('Specific lab order ID'),
    testTypes: z
      .array(z.string())
      .optional()
      .describe('Specific test types to analyze (e.g., CBC, CMP, A1C)'),
    includeHistory: z
      .boolean()
      .optional()
      .default(true)
      .describe('Include historical comparison'),
  })
  .category('query')
  .timeout(30_000)
  .requiresIntegration('ehr_system')
  .handler(async (args, ctx) => {
    ctx.logger.info('Lab analysis requested', {
      patientId: hashPatientId(args.patientId),
      labOrderId: args.labOrderId,
    });

    // Search brain for lab reference ranges and interpretation
    const referenceDocs = await ctx.brain.search(
      `laboratory reference ranges interpretation ${args.testTypes?.join(' ') || 'comprehensive'}`,
      { limit: 5 }
    );

    // Search for clinical significance
    const clinicalDocs = await ctx.brain.search(
      'lab result clinical significance abnormal findings',
      { limit: 3 }
    );

    // Get EHR credentials
    const creds = await ctx.integrations.get<{
      baseUrl: string;
      clientId: string;
      clientSecret: string;
    }>('ehr_system');

    // Fetch and analyze lab results (simulated)
    const analysis = await analyzeLabsFromEHR(creds, args);

    return {
      content: formatLabAnalysis(analysis),
      citations: [...referenceDocs, ...clinicalDocs].slice(0, 5).map((doc) => ({
        title: doc.metadata?.documentLabel || 'Lab Reference',
        snippet: doc.content.slice(0, 150),
      })),
      data: {
        totalTests: analysis.results.length,
        abnormalCount: analysis.results.filter((r) => r.status !== 'normal').length,
        criticalCount: analysis.results.filter((r) => r.status === 'critical').length,
      },
      // Stop recursion if critical values found - needs immediate attention
      stopRecursion: analysis.results.some((r) => r.status === 'critical'),
    };
  })
  .build();

// ==================== Integration ====================

const ehrIntegration = new IntegrationBuilder('ehr_system')
  .displayName('EHR System')
  .description('Electronic Health Record system integration (FHIR-compatible)')
  .oauth2({
    authorizationUrl: 'https://ehr.example.com/oauth2/authorize',
    tokenUrl: 'https://ehr.example.com/oauth2/token',
    scopes: [
      'patient/Patient.read',
      'patient/Encounter.read',
      'patient/Observation.read',
      'patient/MedicationRequest.read',
      'patient/Appointment.read',
      'patient/Appointment.write',
    ],
    pkceEnabled: true,
  })
  .healthCheck({ endpoint: '/fhir/metadata', expectedStatus: [200] })
  .build();

// ==================== Cartridge ====================

const clinicalAssistant = new CartridgeBuilder('clinical-assistant')
  .displayName('Clinical Assistant')
  .description('AI assistant for clinical workflows and decision support')
  .model('gpt-4o')
  .tools([
    'health_search_patient_records',
    'health_clinical_decision_support',
    'health_manage_appointments',
    'health_analyze_labs',
  ])
  .category('support')
  .systemPrompt(`You are a clinical assistant helping healthcare providers with patient care.

You can help with:
- Searching and summarizing patient records
- Clinical decision support for diagnoses and treatment
- Appointment scheduling and management
- Lab result analysis and interpretation

CRITICAL GUIDELINES:
- NEVER display full patient identifiers in responses
- Always cite clinical guidelines and evidence
- Flag critical or abnormal findings prominently
- Recommend appropriate follow-up for concerning findings
- Defer to the clinician for all treatment decisions
- This is decision SUPPORT - not decision MAKING

HIPAA COMPLIANCE:
- Minimum necessary principle - only access needed information
- All access is logged for audit purposes
- Do not store or cache patient information
- Report any potential breaches immediately

When presenting clinical information:
- Use standard medical terminology with explanations
- Highlight abnormal values clearly
- Provide context for findings
- Reference relevant guidelines`)
  .build();

// ==================== Extension Bundle ====================

const extension = new ExtensionBundle({
  name: 'healthcare-tools',
  version: '1.0.0',
  platformVersion: '>=2.0.0',
  description: 'Clinical workflow and decision support tools',
  author: 'Tribble SDK Examples',
  keywords: ['healthcare', 'clinical', 'ehr', 'hipaa', 'medical'],
})
  .handler({
    type: 'http',
    url: process.env.HANDLER_URL || 'http://localhost:3003/extension',
  })
  .tool(searchPatientRecords)
  .tool(clinicalDecisionSupport)
  .tool(manageAppointments)
  .tool(analyzeLabResults)
  .integration(ehrIntegration)
  .cartridge(clinicalAssistant)
  .build();

// Export for platform registration
export default extension;

// Export HTTP handler for deployment
export const handler = createHandler(extension);

// ==================== Helper Functions ====================

/**
 * Hash patient ID for logging (HIPAA compliance)
 */
function hashPatientId(patientId: string): string {
  // In production, use a proper one-way hash
  return `***${patientId.slice(-4)}`;
}

interface PatientRecord {
  type: string;
  date: string;
  description: string;
  provider?: string;
  details?: Record<string, unknown>;
}

async function fetchPatientRecords(
  _creds: { baseUrl: string; clientId: string; clientSecret: string },
  args: {
    patientId: string;
    recordTypes: string[];
    dateRange?: { start: string; end: string };
  }
): Promise<PatientRecord[]> {
  // In production, this would call FHIR API
  return [
    {
      type: 'encounter',
      date: '2024-01-10',
      description: 'Annual wellness visit',
      provider: 'Dr. Smith',
    },
    {
      type: 'diagnosis',
      date: '2024-01-10',
      description: 'Essential hypertension (I10)',
    },
    {
      type: 'medication',
      date: '2024-01-10',
      description: 'Lisinopril 10mg daily',
    },
    {
      type: 'labs',
      date: '2024-01-05',
      description: 'Comprehensive Metabolic Panel',
      details: { ordered: true, resulted: true },
    },
  ];
}

function summarizeRecords(records: PatientRecord[]): PatientRecord[] {
  // Return summarized version without sensitive details
  return records.map((r) => ({
    type: r.type,
    date: r.date,
    description: r.description.slice(0, 50) + (r.description.length > 50 ? '...' : ''),
  }));
}

function formatPatientRecords(records: PatientRecord[], accessLevel: string): string {
  return `**Patient Records (${accessLevel} access)**

Found ${records.length} records:

${records
  .map(
    (r) => `**${r.type.toUpperCase()}** (${r.date})
${r.description}${r.provider ? ` - ${r.provider}` : ''}`
  )
  .join('\n\n')}

---
Access logged for HIPAA compliance.`;
}

interface ClinicalRecommendation {
  items: Array<{
    type: string;
    recommendation: string;
    evidence: string;
    urgency: 'routine' | 'urgent' | 'emergent';
  }>;
  confidence: 'high' | 'moderate' | 'low';
  disclaimers: string[];
}

function generateClinicalRecommendations(args: {
  chiefComplaint: string;
  symptoms?: string[];
  requestType: string;
}): ClinicalRecommendation {
  // In production, this would use clinical algorithms
  return {
    items: [
      {
        type: args.requestType,
        recommendation: `Consider workup for ${args.chiefComplaint}`,
        evidence: 'Based on clinical guidelines',
        urgency: 'routine',
      },
      {
        type: 'history',
        recommendation: 'Complete history and physical examination',
        evidence: 'Standard of care',
        urgency: 'routine',
      },
    ],
    confidence: 'moderate',
    disclaimers: [
      'This is decision support only - clinical judgment required',
      'Consider patient-specific factors not captured here',
    ],
  };
}

function formatClinicalSupport(
  recs: ClinicalRecommendation,
  requestType: string
): string {
  return `**Clinical Decision Support: ${requestType.toUpperCase()}**

Confidence Level: ${recs.confidence.toUpperCase()}

**Recommendations:**
${recs.items
  .map(
    (item, i) =>
      `${i + 1}. **${item.type}** [${item.urgency.toUpperCase()}]
   ${item.recommendation}
   Evidence: ${item.evidence}`
  )
  .join('\n\n')}

---
**Important Disclaimers:**
${recs.disclaimers.map((d) => `- ${d}`).join('\n')}`;
}

interface AppointmentResult {
  success: boolean;
  appointmentId?: string;
  datetime?: string;
  provider?: string;
  location?: string;
  slots?: Array<{ datetime: string; provider: string }>;
}

async function performAppointmentAction(
  _creds: { baseUrl: string; clientId: string; clientSecret: string },
  args: { action: string; appointmentType: string }
): Promise<AppointmentResult> {
  // In production, this would call scheduling API
  if (args.action === 'search') {
    return {
      success: true,
      slots: [
        { datetime: '2024-01-20 09:00', provider: 'Dr. Smith' },
        { datetime: '2024-01-20 14:30', provider: 'Dr. Johnson' },
        { datetime: '2024-01-21 10:00', provider: 'Dr. Smith' },
      ],
    };
  }

  return {
    success: true,
    appointmentId: 'APT-12345',
    datetime: '2024-01-20 09:00',
    provider: 'Dr. Smith',
    location: 'Main Clinic - Room 203',
  };
}

function formatAppointmentResult(result: AppointmentResult, action: string): string {
  if (action === 'search' && result.slots) {
    return `**Available Appointments**

Found ${result.slots.length} slots:

${result.slots
  .map((s, i) => `${i + 1}. ${s.datetime} with ${s.provider}`)
  .join('\n')}

To book, specify the preferred slot.`;
  }

  if (!result.success) {
    return `**Appointment ${action} failed**

Please try again or contact scheduling directly.`;
  }

  return `**Appointment ${action === 'book' ? 'Confirmed' : action.charAt(0).toUpperCase() + action.slice(1) + 'd'}**

Appointment ID: ${result.appointmentId}
Date/Time: ${result.datetime}
Provider: ${result.provider}
Location: ${result.location}`;
}

interface LabResult {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'abnormal' | 'critical';
  trend?: 'improving' | 'worsening' | 'stable';
}

interface LabAnalysis {
  orderId: string;
  collectionDate: string;
  results: LabResult[];
  interpretation: string;
}

async function analyzeLabsFromEHR(
  _creds: { baseUrl: string; clientId: string; clientSecret: string },
  _args: { patientId: string; testTypes?: string[] }
): Promise<LabAnalysis> {
  // In production, this would fetch and analyze real lab data
  return {
    orderId: 'LAB-2024-001',
    collectionDate: '2024-01-05',
    results: [
      { testName: 'Glucose', value: '95', unit: 'mg/dL', referenceRange: '70-100', status: 'normal' },
      { testName: 'Creatinine', value: '1.1', unit: 'mg/dL', referenceRange: '0.7-1.3', status: 'normal' },
      { testName: 'eGFR', value: '78', unit: 'mL/min', referenceRange: '>60', status: 'normal' },
      { testName: 'Potassium', value: '5.8', unit: 'mEq/L', referenceRange: '3.5-5.0', status: 'abnormal', trend: 'worsening' },
      { testName: 'HbA1c', value: '5.6', unit: '%', referenceRange: '<5.7', status: 'normal' },
    ],
    interpretation: 'Elevated potassium noted - consider dietary review and medication check (ACE inhibitor effect).',
  };
}

function formatLabAnalysis(analysis: LabAnalysis): string {
  const abnormal = analysis.results.filter((r) => r.status !== 'normal');
  const statusEmoji = {
    normal: '✅',
    abnormal: '⚠️',
    critical: '🔴',
  };

  return `**Laboratory Results Analysis**

Order ID: ${analysis.orderId}
Collection Date: ${analysis.collectionDate}

| Test | Result | Reference | Status |
|------|--------|-----------|--------|
${analysis.results
  .map(
    (r) =>
      `| ${r.testName} | ${r.value} ${r.unit} | ${r.referenceRange} | ${statusEmoji[r.status]} ${r.status}${r.trend ? ` (${r.trend})` : ''} |`
  )
  .join('\n')}

${
  abnormal.length > 0
    ? `
**Abnormal Findings (${abnormal.length}):**
${abnormal.map((r) => `- **${r.testName}**: ${r.value} ${r.unit} (ref: ${r.referenceRange})${r.trend ? ` - ${r.trend}` : ''}`).join('\n')}`
    : ''
}

**Interpretation:**
${analysis.interpretation}`;
}
