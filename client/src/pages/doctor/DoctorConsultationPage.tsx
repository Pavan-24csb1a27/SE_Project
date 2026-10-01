import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { clinicalApi } from '../../api/clinical.api';
import { appointmentApi } from '../../api/appointment.api';
import type { MedicalRecord, Prescription } from '../../types/clinical';
import type { Doctor } from '../../types/appointment';
import type { User } from '../../types/auth';
import { CriticalAllergyBanner } from '../../components/alerts/CriticalAllergyBanner';
import { PrescriptionBuilder } from '../../components/prescriptions/PrescriptionBuilder';
import {
  Stethoscope,
  Pill,
  FlaskConical,
  UserPlus,
  History,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  User as UserIcon,
} from 'lucide-react';

export const DoctorConsultationPage: React.FC = () => {
  const { civilianId } = useParams<{ civilianId: string }>();

  const [patient, setPatient] = useState<User | null>(null);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [activeTab, setActiveTab] = useState<'notes' | 'prescription' | 'tests' | 'referral' | 'profile'>('notes');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Form states
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Diagnostic Test Form
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [customTest, setCustomTest] = useState('');
  const [testInstructions, setTestInstructions] = useState('');
  const [orderingTest, setOrderingTest] = useState(false);

  // Referral Form
  const [selectedSpecialistId, setSelectedSpecialistId] = useState('');
  const [referralSpecialization, setReferralSpecialization] = useState('General Medicine');
  const [referralReason, setReferralReason] = useState('');
  const [submittingReferral, setSubmittingReferral] = useState(false);

  // Allergy / Profile Edit Form
  const [newAllergen, setNewAllergen] = useState('');
  const [newSeverity, setNewSeverity] = useState<'mild' | 'moderate' | 'critical'>('moderate');
  const [newAllergyNotes, setNewAllergyNotes] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Issued prescription tracking
  const [issuedPrescription, setIssuedPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    if (!civilianId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const [recordRes, doctorsRes] = await Promise.all([
          clinicalApi.getPatientRecord(civilianId),
          appointmentApi.getDoctors(),
        ]);

        setPatient(recordRes.civilian);
        setMedicalRecord(recordRes.record);
        setDoctors(doctorsRes.doctors);

        if (doctorsRes.doctors.length > 0) {
          setSelectedSpecialistId(doctorsRes.doctors[0]._id);
          setReferralSpecialization(doctorsRes.doctors[0].specialization || 'General Medicine');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load patient clinical profile.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [civilianId]);

  // Handle consultation note submit
  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!civilianId || !diagnosis.trim() || !clinicalNotes.trim()) {
      setErrorMsg('Please enter both diagnosis and clinical notes.');
      return;
    }

    try {
      setSavingNotes(true);
      setErrorMsg(null);
      const res = await clinicalApi.addConsultationNote(civilianId, {
        diagnosis: diagnosis.trim(),
        clinicalNotes: clinicalNotes.trim(),
      });

      setMedicalRecord(res.record);
      setActionSuccessMsg('Consultation note saved to patient history.');
      setDiagnosis('');
      setClinicalNotes('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save consultation note.');
    } finally {
      setSavingNotes(false);
    }
  };

  // Handle Diagnostic Lab Order (REQ 4.5)
  const handleOrderTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const tests = [...selectedTests];
    if (customTest.trim()) tests.push(customTest.trim());

    if (tests.length === 0 || !testInstructions.trim()) {
      setErrorMsg('Please specify at least one test name and clinical instructions.');
      return;
    }

    try {
      setOrderingTest(true);
      setErrorMsg(null);
      await clinicalApi.addDiagnosticTest({
        civilianId: civilianId!,
        testNames: tests,
        clinicalInstructions: testInstructions.trim(),
      });

      setActionSuccessMsg(`Diagnostic test order dispatched. Student notified.`);
      setSelectedTests([]);
      setCustomTest('');
      setTestInstructions('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit test order.');
    } finally {
      setOrderingTest(false);
    }
  };

  // Handle Specialist Referral (REQ 4.6)
  const handleReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpecialistId || !referralReason.trim()) {
      setErrorMsg('Please select a specialist and provide a clinical rationale.');
      return;
    }

    try {
      setSubmittingReferral(true);
      setErrorMsg(null);
      await clinicalApi.addReferral({
        civilianId: civilianId!,
        recommendedDoctorId: selectedSpecialistId,
        specialization: referralSpecialization,
        clinicalReason: referralReason.trim(),
      });

      setActionSuccessMsg(
        'Specialist referral registered (REQ 4.6). The student has been notified to schedule an appointment manually.'
      );
      setReferralReason('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit referral.');
    } finally {
      setSubmittingReferral(false);
    }
  };

  // Handle Adding Allergy / Condition
  const handleAddAllergy = async () => {
    if (!newAllergen.trim() || !medicalRecord) return;
    try {
      setSavingProfile(true);
      const updatedAllergies = [
        ...medicalRecord.allergies,
        { allergen: newAllergen.trim(), severity: newSeverity, notes: newAllergyNotes.trim() },
      ];
      const res = await clinicalApi.updatePatientRecord(civilianId!, {
        allergies: updatedAllergies,
      });
      setMedicalRecord(res.record);
      setNewAllergen('');
      setNewAllergyNotes('');
      setActionSuccessMsg('Patient allergy record updated.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update allergies.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddCondition = async () => {
    if (!newCondition.trim() || !medicalRecord) return;
    try {
      setSavingProfile(true);
      const updatedConditions = [...medicalRecord.chronicConditions, newCondition.trim()];
      const res = await clinicalApi.updatePatientRecord(civilianId!, {
        chronicConditions: updatedConditions,
      });
      setMedicalRecord(res.record);
      setNewCondition('');
      setActionSuccessMsg('Patient chronic condition recorded.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update conditions.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          Loading patient clinical chart...
        </div>
      </div>
    );
  }

  if (!patient || !medicalRecord) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800">Patient Record Not Found</h2>
        <Link to="/doctor" className="mt-4 inline-block text-xs font-semibold text-emerald-600">
          ← Return to Doctor Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/doctor"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Consultation Queue
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserIcon className="h-6 w-6 text-emerald-600" />
            Clinical Consultation: {patient.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            University ID: <span className="font-mono font-bold text-slate-700">{patient.universityId}</span> | Dept: {patient.department || 'Campus'} | Email: {patient.email}
          </p>
        </div>
      </div>

      {/* REQ 5.2 SAFETY REQUIREMENT: PROMINENT CRITICAL ALLERGY ALERT BANNER */}
      <CriticalAllergyBanner
        allergies={medicalRecord.allergies}
        chronicConditions={medicalRecord.chronicConditions}
      />

      {/* Status Notifications */}
      {actionSuccessMsg && (
        <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Consultation Workspace Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('notes'); setActionSuccessMsg(null); }}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
            activeTab === 'notes'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Stethoscope className="h-4 w-4" />
          Consultation Notes & Diagnosis
        </button>

        <button
          onClick={() => { setActiveTab('prescription'); setActionSuccessMsg(null); }}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
            activeTab === 'prescription'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Pill className="h-4 w-4" />
          Issue Prescription (REQ 4.4)
        </button>

        <button
          onClick={() => { setActiveTab('tests'); setActionSuccessMsg(null); }}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
            activeTab === 'tests'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FlaskConical className="h-4 w-4" />
          Order Lab Tests (REQ 4.5)
        </button>

        <button
          onClick={() => { setActiveTab('referral'); setActionSuccessMsg(null); }}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
            activeTab === 'referral'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Specialist Referral (REQ 4.6)
        </button>

        <button
          onClick={() => { setActiveTab('profile'); setActionSuccessMsg(null); }}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
            activeTab === 'profile'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <History className="h-4 w-4" />
          History & Allergies
        </button>
      </div>

      {/* Tab 1: Consultation Notes & Diagnosis */}
      {activeTab === 'notes' && (
        <form onSubmit={handleSaveNotes} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-emerald-600" />
            Record Consultation Findings & Diagnosis
          </h3>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Primary Diagnosis *
            </label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Acute Pharyngitis, Seasonal Rhinovirus"
              className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm text-slate-900 bg-white focus:border-emerald-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Clinical Notes & Treatment Plan *
            </label>
            <textarea
              rows={4}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Record observation notes, vitals, temperature, recommended rest and treatment guidance..."
              className="block w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 bg-white focus:border-emerald-600 focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingNotes}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-800 disabled:opacity-50 transition"
            >
              {savingNotes ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Consultation Notes to History</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Digital Prescription Builder (REQ 4.4) */}
      {activeTab === 'prescription' && (
        <div>
          {issuedPrescription && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Prescription Successfully Issued: {issuedPrescription.prescriptionNumber}
              </div>
              <p className="mt-1 text-xs text-emerald-800">
                Dispatched to Pharmacy with status <strong>"open"</strong>. Student received digital receipt.
              </p>
            </div>
          )}

          <PrescriptionBuilder
            appointmentId={civilianId!} // In real visit, maps to active appointment ID
            civilianId={civilianId!}
            patientName={patient.name}
            onSuccess={(rx) => setIssuedPrescription(rx)}
          />
        </div>
      )}

      {/* Tab 3: Diagnostic Lab Tests (REQ 4.5) */}
      {activeTab === 'tests' && (
        <form onSubmit={handleOrderTest} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-emerald-600" />
              Order Diagnostic Lab Tests (SRS REQ 4.5)
            </h3>
            <p className="text-xs text-slate-500">
              Orders will appear on the student dashboard with preparation instructions.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Common Campus Clinic Tests
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {[
                'Complete Blood Count (CBC)',
                'Fasting Blood Glucose',
                'Urine Routine Examination',
                'Lipid Profile',
                'Thyroid Stimulating Hormone (TSH)',
                'Chest X-Ray (PA View)',
              ].map((test) => {
                const isSelected = selectedTests.includes(test);
                return (
                  <button
                    key={test}
                    type="button"
                    onClick={() =>
                      setSelectedTests((prev) =>
                        isSelected ? prev.filter((t) => t !== test) : [...prev, test]
                      )
                    }
                    className={`rounded-lg border p-2.5 text-left text-xs font-semibold transition ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '} {test}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Or Other / Specific Lab Test
            </label>
            <input
              type="text"
              value={customTest}
              onChange={(e) => setCustomTest(e.target.value)}
              placeholder="e.g. Throat Swab Culture, Serum Creatinine"
              className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 bg-white focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Clinical Instructions / Patient Prep *
            </label>
            <textarea
              rows={3}
              value={testInstructions}
              onChange={(e) => setTestInstructions(e.target.value)}
              placeholder="e.g. 10-hour fasting required. Visit clinic pathology room between 8:30 - 10:30 AM."
              className="block w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 bg-white focus:border-emerald-600 focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={orderingTest}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-800 disabled:opacity-50 transition"
            >
              {orderingTest ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Transmit Lab Test Order</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Specialist Referral (REQ 4.6) */}
      {activeTab === 'referral' && (
        <form onSubmit={handleReferral} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-emerald-600" />
              Refer Patient to Specialist (SRS REQ 4.6)
            </h3>
            <p className="text-xs text-slate-500">
              Per REQ_04: UniHealth does <strong>not</strong> automatically book the appointment. The student will receive a notification and book manually.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Select Campus Specialist *
              </label>
              <select
                value={selectedSpecialistId}
                onChange={(e) => {
                  setSelectedSpecialistId(e.target.value);
                  const doc = doctors.find((d) => d._id === e.target.value);
                  if (doc) setReferralSpecialization(doc.specialization || 'General Medicine');
                }}
                className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 bg-white focus:border-emerald-600 focus:outline-none"
              >
                {doctors.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    Dr. {doc.name} — {doc.specialization || 'General Medicine'} ({doc.department || 'Clinic'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Specialization
              </label>
              <input
                type="text"
                value={referralSpecialization}
                onChange={(e) => setReferralSpecialization(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 bg-slate-50"
                readOnly
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Clinical Reason for Referral *
            </label>
            <textarea
              rows={3}
              value={referralReason}
              onChange={(e) => setReferralReason(e.target.value)}
              placeholder="State clinical rationale (e.g. Persistent joint swelling refractory to NSAIDs. Requires orthopedic evaluation)..."
              className="block w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 bg-white focus:border-emerald-600 focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submittingReferral}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-800 disabled:opacity-50 transition"
            >
              {submittingReferral ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Issue Specialist Referral</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 5: Patient History & Allergy Manager */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Quick Allergy Adder */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add Patient Allergy</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <input
                  type="text"
                  value={newAllergen}
                  onChange={(e) => setNewAllergen(e.target.value)}
                  placeholder="Allergen (e.g. Sulfa Drugs)"
                  className="block w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-900"
                />
              </div>
              <div>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as any)}
                  className="block w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-900"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="critical">Critical (Triggers Red Alert Banner)</option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  value={newAllergyNotes}
                  onChange={(e) => setNewAllergyNotes(e.target.value)}
                  placeholder="Notes (e.g. hives, facial swelling)"
                  className="block w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-900"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddAllergy}
              disabled={savingProfile}
              className="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              Add Allergy to Patient Chart
            </button>
          </div>

          {/* Quick Chronic Condition Adder */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add Chronic Condition</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                placeholder="Condition (e.g. Asthma, Hypertension, Type 1 Diabetes)"
                className="block w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-900"
              />
              <button
                type="button"
                onClick={handleAddCondition}
                disabled={savingProfile}
                className="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 shrink-0 disabled:opacity-50"
              >
                Add Condition
              </button>
            </div>
          </div>

          {/* Visit History Timeline */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <History className="h-4 w-4 text-emerald-600" />
              Chronological Consultation Timeline ({medicalRecord.visitHistory.length} visits)
            </h3>

            {medicalRecord.visitHistory.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No past visits recorded for this patient.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {medicalRecord.visitHistory.map((item, idx) => (
                  <div key={idx} className="py-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                      <span>Dr. {item.doctorId?.name || 'Clinic Staff'}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      Diagnosis: {item.diagnosis}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{item.clinicalNotes}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
