interface AuthImagePatternProps {
  title: string;
  subtitle: string;
}

const AuthImagePattern = ({ title, subtitle }: AuthImagePatternProps) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-base-200">
      <div className="max-w-md w-full text-center bg-white/10 backdrop-blur-md p-10 rounded-2xl shadow-2xl">
        
        {/* Avatar / Illustration */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-400 to-pink-400 flex items-center justify-center shadow-lg animate-bounce">
            <span className="text-4xl">💬</span>
          </div>
        </div>

        {/* Title & Subtitle */}
        <h2 className="text-3xl font-extrabold text-indigo-500 mb-3 drop-shadow-lg">
          {title}
        </h2>
        <p className=" text-indigo-400 leading-relaxed mb-8">
          {subtitle}
        </p>

        {/* Decorative Animated Grid */}
        
      </div>
    </div>
  );
};

export default AuthImagePattern;
