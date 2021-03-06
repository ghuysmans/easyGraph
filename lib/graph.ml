type node = {
  x: int;
  y: int;
  text: string;
  isAcceptState: bool;
}

type link = {
  nodeA: int;
  nodeB: int;
  text: string;
  lineAngleAdjust: float;
  parallelPart: float;
  perpendicularPart: float;
  directed: bool;
}

type start_link = {
  node: int;
  text: string;
  deltaX: int;
  deltaY: int;
  directed: bool;
}

type edge =
  | Link of link
  | StartLink of start_link

type t = {
  nodes: node array;
  links: edge list;
}
