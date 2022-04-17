import { execSync } from "child_process";

export function gitUser() {
  // eslint-disable-next-line functional/no-let
  let name, email;

  try {
    name = execSync("git config --get user.name");
    email = execSync("git config --get user.email");
    // eslint-disable-next-line no-empty
  } catch {}

  name = name && JSON.stringify(name.toString().trim()).slice(1, -1);
  email = email && " <" + email.toString().trim() + ">";
  return (name || "") + (email || "");
}
