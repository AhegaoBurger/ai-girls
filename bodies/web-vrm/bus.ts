// bus.ts
import { SoulBodyProtocol } from "../../soul-body-protocol/protocol";
const fireTestbtn = document.getElementById("fireTest") as HTMLButtonElement;

fireTestbtn.addEventListener("click", () => {
  fireTest();
});

async function fireTest() {
  console.log("Test Fired");
}
