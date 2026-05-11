function Hero() {
  return (
    <div
      className="
        w-full 
        w-sm-0
        min-h-screen 
        hidden lg:flex
        md:flex
        
        items-center 
        bg-slate-700
        bg-[url('https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=80&w=1974&auto=format&fit=crop')]
        bg-cover 
        bg-center
      "
    >
      <div className="w-full min-h-screen bg-slate-900/60 flex items-center">
        <div className="px-6 sm:px-10 md:px-16 lg:px-20 max-w-2xl">
          <h1
            className="
              text-white 
              font-semibold 
              leading-tight
              text-2xl 
              sm:text-3xl 
              md:text-4xl 
              lg:text-4xl
            "
          >
            Understand Your Repository.
            <br />
            Improve Every Release.
          </h1>

          <p
            className="
              mt-5 
              text-white 
              text-sm 
              sm:text-base 
              md:text-lg
            "
          >
            Repo Insight AI helps engineering teams find risk, improve code
            quality, and turn repository signals into clear action.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Hero;
