export default function PhoneFrame({ children }) {
  return (
    <div className="phone-frame-backdrop">
      <div className="phone-frame">
        <div className="phone-frame-notch" />
        <div className="phone-frame-screen">{children}</div>
      </div>
    </div>
  )
}
