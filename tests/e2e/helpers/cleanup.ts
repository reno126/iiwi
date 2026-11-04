import { cleanupTestRun } from "./cleanupRun";

cleanupTestRun()
  .then((result) => {
    console.log(
      `Cleanup complete: deleted ${result.count} users recorded for this test run and their dependent records.`,
    );
  })
  .catch((error: unknown) => {
    console.error("Cleanup failed:", error);
    process.exitCode = 1;
  });
