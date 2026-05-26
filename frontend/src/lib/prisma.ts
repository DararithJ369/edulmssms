import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

const createSafePrismaStub = () => {
  const resolveDefaultValue = (methodName: string) => {
    if (methodName === "count") return 0;
    if (methodName === "findMany" || methodName === "groupBy") return [];
    if (methodName === "findUnique" || methodName === "findFirst") return null;
    if (methodName === "aggregate") return {};
    if (methodName === "$transaction") return [];

    return null;
  };

  const createModelProxy = () =>
    new Proxy(
      {},
      {
        get(_target, methodName) {
          if (methodName === Symbol.toStringTag) {
            return "PrismaStub";
          }

          return async () => resolveDefaultValue(String(methodName));
        },
      }
    );

  return new Proxy(
    {},
    {
      get(_target, propertyName) {
        if (propertyName === Symbol.toStringTag) {
          return "PrismaStub";
        }

        if (propertyName === "$transaction") {
          return async (operations: Array<Promise<unknown>>) => {
            return Promise.all(operations);
          };
        }

        if (propertyName === "$disconnect") {
          return async () => undefined;
        }

        return createModelProxy();
      },
    }
  ) as PrismaClient;
};

declare const globalThis: {
  prismaGlobal: PrismaClient | ReturnType<typeof createSafePrismaStub>;
} & typeof global;

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

const prisma =
  globalThis.prismaGlobal ??
  (hasDatabaseUrl ? prismaClientSingleton() : createSafePrismaStub());

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;