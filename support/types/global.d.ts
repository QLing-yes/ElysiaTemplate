import type routes from '@/app/plugins/routes.plug.ts';

declare global {
  type RouterType = typeof routes;
}