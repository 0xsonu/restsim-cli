import { z } from "zod";

export const HelmValuesSchema = z.object({
  replicaCount: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
    z.literal(7),
    z.literal(8),
    z.literal(9),
    z.literal(10),
  ]),
  image: z.object({
    repository: z.enum(["nginx", "httpd", "redis"]),
    tag: z.string(),
    pullPolicy: z.enum(["Always", "IfNotPresent", "Never"]),
  }),
  service: z.object({
    type: z.enum(["ClusterIP", "NodePort", "LoadBalancer"]),
    port: z.number().int().min(1).max(65535),
  }),
});

export type HelmValues = z.infer<typeof HelmValuesSchema>;
