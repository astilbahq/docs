import { Field } from "@astilba/ui/field";
import { Input } from "@astilba/ui/input";
import { Textarea } from "@astilba/ui/textarea";

export const CreateProjectFields = () => (
  <div className="configurator-fields">
    <Field.Root>
      <Field.Label htmlFor="destination">Directory</Field.Label>
      <Input
        aria-describedby="destination-help"
        defaultValue="my-project"
        id="destination"
        maxLength={180}
        name="destination"
        required
        spellCheck={false}
      />
      <Field.Description id="destination-help">
        Create infers the project, package, and repository name as{" "}
        <code data-inferred-name>my-project</code>.
      </Field.Description>
      <Field.Error
        aria-live="polite"
        data-destination-error
        hidden
        id="destination-error"
      />
    </Field.Root>

    <Field.Root>
      <Field.Label htmlFor="description">Description</Field.Label>
      <Textarea
        aria-describedby="description-help"
        id="description"
        maxLength={280}
        name="description"
        placeholder="What will this project do?"
        required
        rows={3}
      />
      <Field.Description id="description-help">
        Plain text, 1–280 characters. Line breaks are not supported.
      </Field.Description>
      <Field.Error
        aria-live="polite"
        data-description-error
        hidden
        id="description-error"
      />
    </Field.Root>

    <Field.Root>
      <Field.Label htmlFor="github-owner">GitHub owner</Field.Label>
      <Input
        aria-describedby="github-owner-help"
        id="github-owner"
        maxLength={39}
        name="githubOwner"
        pattern="[A-Za-z0-9](?:[A-Za-z0-9\-]{0,37}[A-Za-z0-9])?"
        placeholder="your-account"
        required
        spellCheck={false}
      />
      <Field.Description id="github-owner-help">
        The account that will own the generated repository.
      </Field.Description>
      <Field.Error
        aria-live="polite"
        data-github-owner-error
        hidden
        id="github-owner-error"
      />
    </Field.Root>
  </div>
);
