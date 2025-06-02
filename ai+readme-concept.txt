A README under 100 characters signals a poor project for these reasons:

Absence of Context: A short README almost never explains what the project is, why it exists, or who should use it. This denies any user or reviewer immediate context.

Zero Onboarding Value: Critical onboarding elements—installation, usage, contribution guidelines—cannot be explained in so few characters. Any dev or recruiter is left guessing how to use or evaluate the project.

Signals Neglect: An extremely short README shows the author either rushed, didn’t care about documentation, or abandoned the project early. It signals a lack of discipline or standards.

Lack of Professionalism: Good teams and open-source projects treat documentation as part of code quality. A minimal README reveals inexperience or disregard for collaboration.

Reduces Discoverability and Impact: Well-documented projects are easier to adopt, contribute to, and publicize. A short README ensures your work remains invisible, unmaintainable, and unattractive to collaborators.

Conclusion:
If a README is under 100 characters, it guarantees the absence of context, onboarding, professionalism, and impact—regardless of code quality. This is a filter any reviewer or recruiter can use before even reading the content.

solution:
upon rendering each repository from the github api, we fetch the readme for that respective repository, compute the character length, if its less than 100 we just put a warning icon on the same row as the stars and fork row. 
ill write in what the cautionary means somewhere, just tackle rendering it. 
moreover, make the warning icon clickable, which then renders gemini's interpolation / read me in markdown, in a special code block which allows us to copy it. similar to chatgpt's code block. 