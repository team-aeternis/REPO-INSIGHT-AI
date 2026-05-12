import fs from "fs";

export const detectEntryPoints = (files = []) => {
  const entryPoints = [];

  files.forEach((file) => {
    try {
      const content = fs.readFileSync(file, "utf-8");

      // Express
      if (content.includes("app.listen")) {
        entryPoints.push({
          type: "backend",

          confidence: "high",

          file,
        });
      }

      // React
      if (content.includes("createRoot(")) {
        entryPoints.push({
          type: "frontend",

          confidence: "high",

          file,
        });
      }

      // Go
      if (content.includes("func main()")) {
        entryPoints.push({
          type: "backend",

          confidence: "high",

          file,
        });
      }

      // Rust
      if (content.includes("fn main()")) {
        entryPoints.push({
          type: "backend",

          confidence: "high",

          file,
        });
      }

      // Java
      if (content.includes("public static void main")) {
        entryPoints.push({
          type: "backend",

          ecosystem: "java",

          confidence: "high",

          file,
        });
      }

      // Spring Boot
      if (
        content.includes("@SpringBootApplication") ||
        content.includes("SpringApplication.run")
      ) {
        entryPoints.push({
          type: "backend",

          ecosystem: "java",

          framework: "spring-boot",

          confidence: "high",

          file,
        });
      }

      // Django
      if (content.includes("execute_from_command_line")) {
        entryPoints.push({
          type: "backend",

          ecosystem: "python",

          framework: "django",

          confidence: "high",

          file,
        });
      } // Generic Python
      if (
        content.includes('__name__ == "__main__"') ||
        content.includes("__name__ == '__main__'")
      ) {
        entryPoints.push({
          type: "backend",

          ecosystem: "python",

          confidence: "high",

          file,
        });
      }
    } catch {
      return;
    }
  });

  return entryPoints;
};
