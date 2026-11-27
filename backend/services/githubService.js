
import axios from "axios";

const GITHUB_API = "https://api.github.com";
const getGitHubHeaders = () => ({
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  ...(process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}),
});
const encodeRepoParts = (owner, repo) => {
  if (
    typeof owner !== "string" ||
    typeof repo !== "string" ||
    !/^[A-Za-z0-9-]+$/.test(owner) ||
    !/^[A-Za-z0-9._-]+$/.test(repo)
  ) {
    throw new Error("Invalid GitHub repository details.");
  }

  return {
    owner: encodeURIComponent(owner),
    repo: encodeURIComponent(repo),
  };
};

export const getRepositoryInfo = async (owner, repo) => {
  try {
    const encoded = encodeRepoParts(owner, repo);
    const response = await axios.get(
      `${GITHUB_API}/repos/${encoded.owner}/${encoded.repo}`,
      {
        // headers: {
        //   Accept: "application/vnd.github+json",
        // },
        headers: getGitHubHeaders(),
        timeout: 15000,
      }
    );

    return {
      name: response.data.name,
      fullName: response.data.full_name,
      description: response.data.description,
      defaultBranch: response.data.default_branch,
      private: response.data.private,
      htmlUrl: response.data.html_url,
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error("Repository not found or not publicly accessible.");
    }

    if (error.response?.status === 403) {
      throw new Error("GitHub API rate limit exceeded. Try again later.");
    }

    throw new Error("Unable to connect to GitHub.");
  }
};


export const getRepositoryBranches = async (owner, repo) => {
  try {
    const encoded = encodeRepoParts(owner, repo);

    const response = await axios.get(
      `${GITHUB_API}/repos/${encoded.owner}/${encoded.repo}/branches`,
      {
        headers: {
          Accept: "application/vnd.github+json",
        },
        params: {
          per_page: 100,
        },
        timeout: 15000,
      }
    );

    return response.data.map((branch) => ({
      name: branch.name,
      commitSha: branch.commit.sha,
    }));
  } catch (error) {
    console.error(
      "GitHub branches API error:",
      error.response?.data || error.message
    );

    if (error.response?.status === 404) {
      throw new Error("Repository or branches not found.");
    }

    if (error.response?.status === 403) {
      throw new Error("GitHub API rate limit exceeded. Try again later.");
    }

    throw new Error("Unable to fetch repository branches.");
  }
};




export const getRepositoryFiles = async (owner, repo, branch) => {
  try {
    const encoded = encodeRepoParts(owner, repo);

    if (!branch) {
      throw new Error("Please select a repository branch.");
    }

    const response = await axios.get(
      `${GITHUB_API}/repos/${encoded.owner}/${encoded.repo}/git/trees/${encodeURIComponent(branch)}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
        },
        params: {
          recursive: 1,
        },
        timeout: 30000,
      }
    );

    const supportedExtensions = [".py", ".js", ".jsx"];

    const files = (response.data.tree || [])
      .filter((item) => {
        if (item.type !== "blob") return false;

        const extension = item.path
          .slice(item.path.lastIndexOf("."))
          .toLowerCase();

        return (
          supportedExtensions.includes(extension) &&
          item.size <= 100000
        );
      })
      .slice(0, 50)
      .map((item) => ({
        path: item.path,
        sha: item.sha,
        size: item.size,
      }));

    console.log("GitHub source files found:", files.length);

    return {
      files,
      truncated: response.data.truncated || false,
    };
  } catch (error) {
    console.error(
      "GitHub files API error:",
      error.response?.data || error.message
    );

    throw new Error(
      error.message || "Unable to fetch repository files."
    );
  }
};




export const getRepositoryFileContent = async (
  owner,
  repo,
  branch,
  filePath
) => {
  try {
    const encoded = encodeRepoParts(owner, repo);

    const encodedPath = filePath
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");

    const response = await axios.get(
      `${GITHUB_API}/repos/${encoded.owner}/${encoded.repo}/contents/${encodedPath}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
        },
        params: {
          ref: branch,
        },
        timeout: 15000,
      }
    );

    if (response.data.type !== "file") {
      throw new Error("The selected path is not a file.");
    }

    if (response.data.size > 100000) {
      throw new Error("File is too large to analyze (maximum 100 KB).");
    }

    if (
      response.data.encoding !== "base64" ||
      typeof response.data.content !== "string"
    ) {
      throw new Error("GitHub returned unsupported file content.");
    }

    const content = Buffer.from(
      response.data.content.replace(/\s/g, ""),
      "base64"
    ).toString("utf8");

    return {
      path: response.data.path,
      content,
      size: response.data.size,
    };
  } catch (error) {
    console.error(
      "GitHub file content error:",
      error.response?.data || error.message
    );

    if (error.response?.status === 404) {
      throw new Error("The requested file was not found.");
    }

    if (
      error.message.includes("too large") ||
      error.message.includes("not a file") ||
      error.message.includes("unsupported")
    ) {
      throw error;
    }

    if (error.response?.status === 403) {
      throw new Error("GitHub API rate limit exceeded. Try again later.");
    }

    throw new Error("Unable to download source-code file.");
  }
};
