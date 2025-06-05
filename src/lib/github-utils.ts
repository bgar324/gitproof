import { GitHubRepo } from "@/types/github";

export interface Commit {
  commit: {
    author: {
      date: string;
    };
  };
}

interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
    id: number;
  } | null;
}

export async function fetchAllCommits(
  accessToken: string,
  username: string,
  repos: GitHubRepo[]
): Promise<Date[]> {
  console.log(
    `[fetchAllCommits] Starting to fetch commits for ${repos.length} repositories`
  );
  const allCommits: Date[] = [];
  let repoCount = 0;

  // First, get the authenticated user's login if not provided
  if (!username) {
    console.log(
      "[fetchAllCommits] No username provided, fetching authenticated user..."
    );
    try {
      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        username = userData.login;
        console.log(`[fetchAllCommits] Using authenticated user: ${username}`);
      }
    } catch (error) {
      console.error(
        "[fetchAllCommits] Error fetching authenticated user:",
        error
      );
    }
  }

  for (const repo of repos) {
    repoCount++;
    // Skip forks for commit history to avoid duplicates
    if (repo.fork) {
      console.log(
        `[fetchAllCommits] [${repoCount}/${repos.length}] Skipping fork: ${repo.full_name}`
      );
      continue;
    }

    console.log(
      `[fetchAllCommits] [${repoCount}/${repos.length}] Fetching commits for: ${repo.full_name}`
    );
    let page = 1;
    let hasMore = true;
    let commitCount = 0;

    while (hasMore && page <= 10) {
      // Limit to 10 pages (1000 commits) per repo to avoid rate limiting
      try {
        // Try with author filter first
        let url = `https://api.github.com/repos/${repo.full_name}/commits?per_page=100&page=${page}`;

        // Only add author filter if we have a username
        if (username) {
          url += `&author=${username}`;
        }

        console.log(
          `[fetchAllCommits] [${repo.full_name}] Fetching page ${page}...`
        );

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-GitHub-Api-Version": "2022-11-28",
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `[fetchAllCommits] [${repo.full_name}] Error fetching commits (page ${page}):`,
            {
              status: response.status,
              statusText: response.statusText,
              error: errorText,
              url: url,
            }
          );

          // If we get a 404, the repo might not exist or we don't have access
          if (response.status === 404) {
            console.error(
              `[fetchAllCommits] [${repo.full_name}] Repository not found or no access`
            );
          }

          break;
        }

        const commits: GitHubCommit[] = await response.json();
        console.log(
          `[fetchAllCommits] [${repo.full_name}] Fetched ${commits.length} commits from page ${page}`
        );

        if (commits.length === 0) {
          console.log(`[fetchAllCommits] [${repo.full_name}] No more commits`);
          hasMore = false;
          break;
        }

        // Filter commits by author if we have a username
        const userCommits = username
          ? commits.filter(
              (commit) =>
                commit.author?.login?.toLowerCase() ===
                  username?.toLowerCase() ||
                commit.commit.author.email
                  .toLowerCase()
                  .includes(username.toLowerCase())
            )
          : commits;

        console.log(
          `[fetchAllCommits] [${repo.full_name}] Filtered to ${userCommits.length} commits by user`
        );

        // Add commit dates to our collection
        userCommits.forEach((commit) => {
          allCommits.push(new Date(commit.commit.author.date));
        });

        commitCount += userCommits.length;

        // Check if there are more pages
        const linkHeader = response.headers.get("link");
        hasMore = linkHeader?.includes('rel="next"') || false;
        page++;

        // Be nice to the GitHub API
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `[fetchAllCommits] [${repo.full_name}] Error processing commits:`,
          error
        );
        hasMore = false;
      }
    }

    console.log(
      `[fetchAllCommits] [${repo.full_name}] Processed ${commitCount} commits`
    );
  }

  console.log(
    `[fetchAllCommits] Finished fetching commits. Total commits: ${allCommits.length}`
  );
  return allCommits;

  return allCommits;
}

export function calculateLongestStreak(commitDates: Date[]): number {
  if (commitDates.length === 0) return 0;

  // Sort dates in ascending order
  const sortedDates = [
    ...new Set(
      commitDates.map((date) => new Date(date).toISOString().split("T")[0])
    ),
  ].sort();

  if (sortedDates.length === 0) return 0;

  let currentStreak = 1;
  let longestStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i]);
    const previousDate = new Date(sortedDates[i - 1]);

    // Calculate difference in days
    const diffTime = currentDate.getTime() - previousDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (diffDays > 1) {
      // Not consecutive, reset streak
      currentStreak = 1;
    }
  }

  return longestStreak;
}
