import { LearningBondApplicationFields } from '@promisehub/api';
import { formatDate } from '@promisehub/components';
import { GuardianLearningBondText } from './guardian-learning-bond-text';
import { LearningBondApplicationRow } from './learning-bond-application-row';

/** Every field of the application in the order the provider's form asks for them, SINs only as their last three digits (L2-148, L2-150). */
export function learningBondApplicationRows(
  t: GuardianLearningBondText,
  firstName: string,
  f: LearningBondApplicationFields,
): LearningBondApplicationRow[] {
  const masked = (last3: string | null) => (last3 ? `••• ••• ${last3}` : '—');
  return [
    { label: t.fieldName, value: f.beneficiaryName, field: null, error: null },
    {
      label: t.fieldBirth,
      value: f.dateOfBirth ? formatDate(f.dateOfBirth) : '—',
      field: null,
      error: null,
    },
    { label: t.fieldChildSin(firstName), value: masked(f.childSin), field: null, error: null },
    { label: t.fieldCaregiver, value: f.caregiverName, field: null, error: null },
    {
      label: t.fieldAddress,
      value: f.address ?? '—',
      field: 'address',
      error: f.address ? null : t.addAddress,
    },
    { label: t.fieldGuardianSin, value: masked(f.guardianSin), field: null, error: null },
    { label: t.fieldPhone, value: f.phone ?? '—', field: 'phone', error: null },
    { label: t.fieldEmail, value: f.email ?? '—', field: 'email', error: null },
    { label: t.fieldLanguage, value: f.language, field: null, error: null },
  ];
}
