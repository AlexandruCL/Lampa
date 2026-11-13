import { useParams } from "react-router";

export default function Site() {
  const { siteId } = useParams();
  return <>Site {siteId}</>;
}
