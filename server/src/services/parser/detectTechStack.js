const hasPackage = (set, ...names) => names.some((name) => set.has(name));

export const detectTechStack = ({ dependencies = [], devDependencies = [] } = {}) => {
  const allPackages = new Set(
    [...dependencies, ...devDependencies]
      .map((dep) => dep?.name)
      .filter(Boolean),
  );

  const frontend = [
    hasPackage(allPackages, "react") && "React",
    hasPackage(allPackages, "next") && "Next.js",
    hasPackage(allPackages, "vue") && "Vue",
    hasPackage(allPackages, "angular") && "Angular",
    hasPackage(allPackages, "react-router-dom") && "React Router",
  ].filter(Boolean);

  const backend = [
    hasPackage(allPackages, "express") && "Express",
    hasPackage(allPackages, "nestjs") && "NestJS",
    hasPackage(allPackages, "fastify") && "Fastify",
    hasPackage(allPackages, "koa") && "Koa",
  ].filter(Boolean);

  const database = [
    hasPackage(allPackages, "mongoose", "mongodb") && "MongoDB",
    hasPackage(allPackages, "pg") && "PostgreSQL",
    hasPackage(allPackages, "mysql2") && "MySQL",
    hasPackage(allPackages, "sqlite3") && "SQLite",
    hasPackage(allPackages, "redis", "ioredis") && "Redis",
  ].filter(Boolean);

  const styling = [
    hasPackage(allPackages, "tailwindcss") && "Tailwind CSS",
    hasPackage(allPackages, "bootstrap") && "Bootstrap",
    hasPackage(allPackages, "sass") && "Sass",
    hasPackage(allPackages, "styled-components") && "Styled Components",
    hasPackage(allPackages, "@mui/material") && "Material UI",
  ].filter(Boolean);

  return {
    frontend: [...new Set(frontend)],
    backend: [...new Set(backend)],
    database: [...new Set(database)],
    styling: [...new Set(styling)],
  };
};
