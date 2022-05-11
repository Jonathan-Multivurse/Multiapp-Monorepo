import { ReactNode } from "react";
import {
  DataFunc,
  Mention,
  MentionsInput as MentionsInputReact17,
  MentionsInputProps,
} from "react-mentions";
import styles from "./index.module.scss";
import { ShieldCheck } from "phosphor-react";

import {
  useController,
  Controller,
  ControllerProps,
  FieldValues,
  Path,
} from "react-hook-form";
import * as yup from "yup";
import Avatar from "../Avatar";
import { useUsers } from "mobile/src/graphql/query/user/useUsers";
import { useAccount } from "mobile/src/graphql/query/account/useAccount";

// TODO: Stopgap measure to address breaking type changes for fragments ({})
// in React 18.
const MentionsInput =
  MentionsInputReact17 as unknown as React.FC<MentionsInputProps>;

export const mentionTextSchema = yup
  .object({
    body: yup.string().default(""),
    mentions: yup
      .array()
      .of(
        yup
          .object({
            id: yup.string().required(),
            name: yup.string().required(),
          })
          .required(),
      )
      .default([]),
  })
  .required();

type MentionTextareaProps<TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>> = Omit<ControllerProps<TFieldValues, TName>, "render">;

function MentionTextarea<TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>>(controllerProps: MentionTextareaProps<TFieldValues, TName>) {
  const mentionsController = useController<TFieldValues, TName>({
    ...controllerProps,
    name: `${controllerProps.name}.mentions` as TName,
  });
  const { data: { account } = {} } = useAccount({ fetchPolicy: "cache-only" });
  const { data: { users: allUsers = [] } = {} } = useUsers();
  const users = allUsers.filter(user => user._id != account?._id);

  const dataFunc: DataFunc = (query, callback) => {
    const items = users
      .filter(({ firstName, lastName }) =>
        firstName.toLowerCase().includes(query.toLowerCase()) ||
        lastName.toLowerCase().includes(query.toLowerCase()),
      )
      .map(({ _id, firstName, lastName }) => ({
        id: _id,
        display: `${firstName} ${lastName}`,
      }));
    callback(items);
  };

  return (
    <div className="text-sm text-white h-full">
      <Controller
        {...controllerProps}
        name={`${controllerProps.name}.body` as TName}
        render={({ field }) => (
          <MentionsInput
            value={field.value}
            onChange={(evtIgnored, newValue) => field.onChange(newValue)}
            placeholder={
              "Create a post\nUse $ before ticker symbols: ex: $TSLA\nUse @ to tag a user, page or fund"
            }
            classNames={styles}
          >
            <Mention
              trigger="@"
              data={dataFunc}
              className={styles.mentions__mention}
              appendSpaceOnAdd
              onAdd={(id, display) => {
                mentionsController.field.onChange([
                  ...mentionsController.field.value,
                  {
                    id,
                    name: display,
                  },
                ]);
              }}
              renderSuggestion={(suggestion, search, highlightedDisplay) => {
                const user = users.find((user) => user._id == suggestion.id);
                return (
                  <div className="flex items-center p-2">
                    <div className="flex items-center">
                      <Avatar user={user} size={56} />
                    </div>
                    <div className="ml-2">
                      <div className="flex items-center">
                        <div className="text-base">
                          {highlightedDisplay as unknown as ReactNode}
                        </div>
                        {user?.role == "PROFESSIONAL" &&
                          <div className="flex items-center">
                            <div className="text-success ml-2">
                              <ShieldCheck
                                color="currentColor"
                                weight="fill"
                                size={16}
                              />
                            </div>
                            <div className="text-white text-tiny ml-1.5">
                              PRO
                            </div>
                          </div>
                        }
                      </div>
                      <div className="text-white text-xs opacity-60">
                        {user?.position}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </MentionsInput>
        )}
      />
    </div>
  );
}

export default MentionTextarea;
