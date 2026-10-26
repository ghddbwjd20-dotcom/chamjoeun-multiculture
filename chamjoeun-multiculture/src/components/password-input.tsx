"use client";
import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
export function PasswordInput({
  name = "password",
  label = "비밀번호",
  newPassword = false,
  showStrength = false,
}: {
  name?: string;
  label?: string;
  newPassword?: boolean;
  showStrength?: boolean;
}) {
  const [visible, setVisible] = useState(false),
    [value, setValue] = useState("");
  const id = useId();
  const strength =
    value.length >= 16
      ? 4
      : value.length >= 12
        ? 3
        : value.length >= 8
          ? 2
          : value.length
            ? 1
            : 0;
  return (
    <label className="password-label" htmlFor={id}>
      {label}
      <span className="password-control">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={newPassword ? "new-password" : "current-password"}
          minLength={newPassword ? 12 : undefined}
          maxLength={128}
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          type="button"
          aria-label={`${label} ${visible ? "숨기기" : "표시"}`}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
      {showStrength && (
        <>
          <span className="password-strength" aria-hidden="true">
            {[1, 2, 3, 4].map((n) => (
              <i key={n} className={strength >= n ? "filled" : ""} />
            ))}
          </span>
          <small>
            {value.length >= 12
              ? "사용 가능한 길이입니다. 다른 사이트와 다른 비밀번호를 권장합니다."
              : "12자 이상으로 입력해 주세요. 긴 문장 형태도 사용할 수 있습니다."}
          </small>
        </>
      )}
    </label>
  );
}
