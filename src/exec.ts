import {
	exec as _childProcessExec,
	type ExecException,
} from "node:child_process";
import { promises as fs } from "node:fs";
import { EOL } from "node:os";
import { promisify } from "node:util";

export { exec } from "@actions/exec";

const childProcessExec = promisify(_childProcessExec);

type ExecAsyncException = ExecException & {
	stderr: string;
	stdout: string;
};

function isExecAsyncException(err: unknown): err is ExecAsyncException {
	return err instanceof Error && "code" in err && "stderr" in err;
}

export async function execShell(
	command: string,
	{
		silent = false,
		...options
	}: Parameters<typeof childProcessExec>[1] & { silent?: boolean } = {},
) {
	if (!silent) {
		process.stdout.write("[command]" + command + EOL);
	}

	if (command.includes("export")) {
		command += ` ; node -pe 'JSON.stringify(process.env)' > ${process.env.RUNNER_TEMP}/wrangler-env`
	}

	try {
		const promise = childProcessExec(command, {
			...options,
		});

		const { child } = promise;

		if (!silent) {
			child.stdout?.on("data", (data: Buffer) => process.stdout.write(data));
			child.stderr?.on("data", (data: Buffer) => process.stderr.write(data));
		}

		await promise;

		if (command.includes("export")) {
			process.env = JSON.parse(await fs.readFile(`${process.env.RUNNER_TEMP}/wrangler-env`, 'utf-8'));
			console.log(process.env);
		}

		return child.exitCode;
	} catch (err: any) {
		if (isExecAsyncException(err)) {
			process.stderr.write(err.stderr);
			throw new Error(`Process failed with exit code ${err.code}`);
		}

		throw err;
	}
}
