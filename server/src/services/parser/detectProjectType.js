export const detectProjectType = (
  files = []
) => {

  // NODE
  const packageJson = files.find(
    file => file.endsWith("package.json")
  );

  if (packageJson) {

    return {
      ecosystem: "nodejs",
      manifestFile: packageJson
    };
  }

  // PYTHON
  const requirements = files.find(
    file =>
      file.endsWith("requirements.txt")
  );

  if (requirements) {

    return {
      ecosystem: "python",
      manifestFile: requirements
    };
  }

  // GO
  const goMod = files.find(
    file => file.endsWith("go.mod")
  );

  if (goMod) {

    return {
      ecosystem: "golang",
      manifestFile: goMod
    };
  }

  // RUST
  const cargo = files.find(
    file => file.endsWith("Cargo.toml")
  );

  if (cargo) {

    return {
      ecosystem: "rust",
      manifestFile: cargo
    };
  }

  // JAVA MAVEN
  const pomXml = files.find(
    file => file.endsWith("pom.xml")
  );

  if (pomXml) {

    return {
      ecosystem: "java",
      manifestFile: pomXml
    };
  }

  return {
    ecosystem: "unknown",
    manifestFile: null
  };
};