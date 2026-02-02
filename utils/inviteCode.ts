// Mock valid codes for development
const VALID_CODES = [
  'NOMAD2024',
  'DETOUR123',
  'EARLYBIRD',
  'COWORKING',
  'REMOTEWORK',
];

export interface ValidateCodeResult {
  isValid: boolean;
  error?: string;
}

// Mock validation - replace with API call later
export async function validateInviteCode(code: string): Promise<ValidateCodeResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const normalizedCode = code.toUpperCase().trim();

  if (normalizedCode.length < 4) {
    return { isValid: false, error: 'code must be at least 4 characters' };
  }

  if (VALID_CODES.includes(normalizedCode)) {
    return { isValid: true };
  }

  return { isValid: false, error: 'invalid invite code. please check and try again.' };
}
