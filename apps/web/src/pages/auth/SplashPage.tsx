export default function SplashPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-6 animate-fade-in">
      {/* Logo mark */}
      <div className="w-20 h-20 rounded-3xl bg-teal-600 flex items-center justify-center shadow-2xl shadow-teal-600/30">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M8 20L20 8L32 20L20 32L8 20Z" fill="white" fillOpacity="0.2" />
          <path d="M14 20L20 14L26 20L20 26L14 20Z" fill="white" />
        </svg>
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary">ZeroPay</h1>
        <p className="text-text-secondary text-sm mt-1">Blockchain payments, simplified</p>
      </div>
      {/* Spinner */}
      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
