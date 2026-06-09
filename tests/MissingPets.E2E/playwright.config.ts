import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  reporter: 'list',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5173',
  },
  webServer: [
    {
      command: 'dotnet run --project ../../src/MissingPets.Api/MissingPets.Api.csproj --no-launch-profile --urls http://127.0.0.1:5087',
      url: 'http://127.0.0.1:5087/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        ASPNETCORE_ENVIRONMENT: 'Development',
      },
    },
    {
      command: '"C:\\Program Files\\nodejs\\npm.cmd" run dev -- --host 127.0.0.1 --port 5173',
      cwd: '../../src/MissingPets.Web',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
})
