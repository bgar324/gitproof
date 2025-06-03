// types/github.ts

export interface GitHubOwner {
    login: string
    id: number
    avatar_url: string
    url: string
    html_url: string
    type: string
  }
  
  export interface GitHubRepo {
    id: number
    node_id?: string
    name: string
    full_name: string
    private: boolean
    owner: GitHubOwner
    html_url: string
    description: string | null
    fork: boolean
    url: string
    forks_url: string
    keys_url: string
    collaborators_url: string
    teams_url: string
    hooks_url: string
    issue_events_url: string
    events_url: string
    assignees_url: string
    branches_url: string
    tags_url: string
    blobs_url: string
    git_tags_url: string
    git_refs_url: string
    trees_url: string
    statuses_url: string
    languages_url: string
    stargazers_url: string
    contributors_url: string
    subscribers_url: string
    subscription_url: string
    commits_url: string
    git_commits_url: string
    comments_url: string
    issue_comment_url: string
    contents_url: string
    compare_url: string
    merges_url: string
    archive_url: string
    downloads_url: string
    issues_url: string
    pulls_url: string
    milestones_url: string
    notifications_url: string
    labels_url: string
    releases_url: string
    deployments_url: string
    created_at: string
    updated_at: string
    pushed_at: string
    git_url: string
    ssh_url: string
    clone_url: string
    svn_url: string
    homepage: string | null
    size: number
    stargazers_count: number
    watchers_count: number
    language: string | null
    forks_count: number
    open_issues_count: number
    default_branch: string
    topics?: string[]
    // extra injected by dashboard/page.tsx:
    commit_count?: number
    contributors_count?: number
    has_readme?: boolean
  }
  
  