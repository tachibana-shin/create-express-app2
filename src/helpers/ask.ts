import { prompt as iPrompt } from "inquirer"

import { evaluate } from "../utils/evaluate"

// Support types from prompt-for which was used before
const promptTypeAlias = {
  string: "input",
  boolean: "confirm",
}

async function prompt<Data extends Record<string, Record<string, unknown>>>(
  data: Data,
  key: keyof Data,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prompt: any
) {
  // skip prompts whose when condition is not met
  if (prompt.when && !evaluate(prompt.when, data)) {
    return
  }

  // eslint-disable-next-line functional/no-let
  let promptDefault = prompt.default
  if (typeof prompt.default === "function") {
    promptDefault = () => prompt.default(data)
  }

  const answers = await iPrompt([
    {
      type:
        promptTypeAlias[prompt.type as keyof typeof promptTypeAlias] ??
        prompt.type,
      name: key,
      message: prompt.message || key,
      default: promptDefault,
      choices: prompt.choices || [],
      validate: prompt.validate || (() => true),
    },
  ])

  const thisAnswer = answers[key]

  if (Array.isArray(thisAnswer)) {
    // eslint-disable-next-line functional/immutable-data, @typescript-eslint/no-explicit-any
    ;(data as any)[key] = {}
    thisAnswer.forEach((multiChoiceAnswer) => {
      // eslint-disable-next-line functional/immutable-data, @typescript-eslint/no-explicit-any
      ;(data as any)[key][multiChoiceAnswer] = true
    })
  } else if (typeof thisAnswer === "string") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, functional/immutable-data
    ;(data as any)[key] = (thisAnswer as string).replace(/"/g, '\\"')
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, functional/immutable-data
    ;(data as any)[key] = thisAnswer
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ask(prompts: any, data: any) {
  // eslint-disable-next-line functional/no-loop-statement
  for (const key in prompts) {
    await prompt(data, key, prompts[key])
  }
}
