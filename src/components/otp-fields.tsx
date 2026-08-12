import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export function OtpFields({
  value,
  onChange,
  onComplete,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-center">
      <InputOTP
        maxLength={6}
        value={value}
        onChange={(v) => onChange(v.replace(/\D/g, "").slice(0, 6))}
        onComplete={onComplete}
        disabled={disabled}
        inputMode="numeric"
        autoFocus
      >
        <InputOTPGroup className="gap-1.5 sm:gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <InputOTPSlot
              key={i}
              index={i}
              className="h-11 w-9 rounded-md border text-base sm:h-12 sm:w-11 sm:text-lg"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}

export function useCooldown() {
  return null;
}