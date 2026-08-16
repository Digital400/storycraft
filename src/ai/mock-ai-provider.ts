import {
  AIProvider,
  StoryGenerationRequest,
  StoryGenerationResult
} from "./ai-provider.js";

import { Story } from "../schemas/story.js";
import { Epic } from "../schemas/epic.js";

export class MockAIProvider implements AIProvider {
  name = "mock";

  async generateStories(
    request: StoryGenerationRequest
  ): Promise<StoryGenerationResult> {
    // HLD is now available to every AI provider.
    // The mock provider does not use it yet because
    // it is only used for testing the workflow.
    const hldSource = request.hld.source;

    const projectName =
      typeof request.context.problem === "object" &&
        request.context.problem !== null &&
        "project" in request.context.problem
        ? String(request.context.problem.project)
        : "Unknown Project";

    const epic: Epic = {
      id: "EPIC-001",
      title: "Order Management",
      description:
        "Provide digital order creation and management capabilities.",
      businessValue:
        `Allows ${projectName} customers to create and manage orders digitally.`
    };

    const stories: Story[] = [
      {
        id: "ST-001",
        epicId: "EPIC-001",
        title: "Create Order API",
        description:
          "Create an API that allows authenticated customers to create a new order.",
        businessValue:
          "Allows customers to place orders digitally.",
        acceptanceCriteria: [
          "Authenticated users can submit a valid order.",
          "The API returns the created order ID.",
          "Invalid orders return a validation error."
        ],
        technicalRequirements: [
          "Create POST /orders endpoint.",
          "Validate the request payload.",
          "Persist the order in the database."
        ],
        dependencies: [],
        hldReferences: [
          "Order Management API"
        ],
        estimate: {
          storyPoints: 5
        }
      },

      {
        id: "ST-002",
        epicId: "EPIC-001",
        title: "Validate Order",
        description:
          "Validate order information before the order is created.",
        businessValue:
          "Prevents invalid orders from entering the system.",
        acceptanceCriteria: [
          "Product information is validated.",
          "Customer information is validated.",
          "Invalid orders are rejected with a clear error."
        ],
        technicalRequirements: [
          "Validate customer information.",
          "Validate product information.",
          "Return validation errors."
        ],
        dependencies: [
          "ST-001"
        ],
        hldReferences: [
          "Order Management API",
          "Product Service"
        ],
        estimate: {
          storyPoints: 3
        }
      },

      {
        id: "ST-003",
        epicId: "EPIC-001",
        title: "Store Order",
        description:
          "Persist successfully validated orders in the order database.",
        businessValue:
          "Ensures customer orders are securely stored and available for processing.",
        acceptanceCriteria: [
          "Valid orders are stored successfully.",
          "An order ID is generated.",
          "Database failures are handled correctly."
        ],
        technicalRequirements: [
          "Create order persistence logic.",
          "Use the Order Database.",
          "Handle database errors."
        ],
        dependencies: [
          "ST-002"
        ],
        hldReferences: [
          "Order Database"
        ],
        estimate: {
          storyPoints: 5
        }
      }
    ];

    return {
      epics: [epic],
      stories
    };
  }
}