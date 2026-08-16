import type { NextConfig } from "next";
import { execSync } from "child_process";

function getGitCommitHash(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7);
  }
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "dev";
  }
}

function getGitCommitMsg(): string {
  if (process.env.VERCEL_GIT_COMMIT_MESSAGE) {
    return process.env.VERCEL_GIT_COMMIT_MESSAGE;
  }
  try {
    return execSync("git log -1 --pretty=%B").toString().trim();
  } catch {
    return "咩nu 團購點餐平台";
  }
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  env: {
    NEXT_PUBLIC_GIT_COMMIT_HASH: getGitCommitHash(),
    NEXT_PUBLIC_GIT_COMMIT_MSG: getGitCommitMsg(),
  },
};

export default nextConfig;
