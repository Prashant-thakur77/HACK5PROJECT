import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};
// Ignore changes in backend folder
nextConfig.webpack = function (config) {
  config.watchOptions = {
    ...config.watchOptions,
    ignored: ['**/backend/**']
  }
  return config
}
export default nextConfig;
