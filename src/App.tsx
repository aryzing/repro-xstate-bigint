import { createBrowserInspector } from "@statelyai/inspect";
import { useActor } from "@xstate/solid";
import { Match, Switch } from "solid-js";
import { fromPromise, setup } from "xstate";

const exampleMachine = setup({
  types: {
    context: {} as {
      data?: bigint;
    },
  },
  actors: {
    mockApiCall: fromPromise(async () => {
      // delay 1s

      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (Math.random() > 0.5)
        throw new Error("Mock API error, fails 50% of the time");

      return { success: true, data: 123456n };
    }),
  },
}).createMachine({
  initial: "Idle",
  states: {
    Idle: {
      on: {
        FETCH: "Loading",
      },
    },
    Loading: {
      invoke: {
        src: "mockApiCall",
        onDone: {
          target: "Success",
          actions: ({ event }) => {
            console.log("data", event.output.data);
          },
        },
        onError: {
          target: "Failure",
          actions: ({ event }) => {
            console.error("error", event.error);
          },
        },
      },
    },
    Success: {
      on: {
        FETCH: "Loading",
      },
    },
    Failure: {
      on: {
        FETCH: "Loading",
      },
    },
  },
});

const inspector = createBrowserInspector();

function App() {
  const [state, send] = useActor(exampleMachine, {
    inspect: inspector.inspect,
  });

  return (
    <>
      <h1>Simulated API calls</h1>

      <p>Click the button to simulate an API call</p>
      <Switch>
        <Match when={state.matches("Idle")}>
          <p>Idle</p>
        </Match>
        <Match when={state.matches("Loading")}>
          <p>Loading...</p>
        </Match>
        <Match when={state.matches("Success")}>
          <p>Success!</p>
        </Match>
      </Switch>
      <button onClick={() => send({ type: "FETCH" })}>Fetch data</button>
    </>
  );
}

export default App;
