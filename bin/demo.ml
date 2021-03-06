let sum_of_yojson ~err fs = function
  | `Assoc l ->
    (match l |> List.partition (function "type", _ -> true | _ -> false) with
     | [_, `String typ], l ->
       (match List.assoc_opt typ fs with
        | None -> Error err
        | Some f -> f (`Assoc l))
     | _ -> Error err)
  | _ -> Error err


module G = struct
  type link = [%import: EasyGraph.Graph.link] [@@deriving yojson]
  type start_link = [%import: EasyGraph.Graph.start_link] [@@deriving yojson]
  type edge = EasyGraph.Graph.edge
  let edge_of_yojson =
    let (>|=) = Ppx_deriving_yojson_runtime.(>|=) in
    let open EasyGraph.Graph in
    sum_of_yojson ~err:"edge_of_yojson" [
      "Link", (fun l -> link_of_yojson l >|= fun l -> Link l);
      "StartLink", (fun l -> start_link_of_yojson l >|= fun l -> StartLink l);
    ]
  let edge_to_yojson = function
    | EasyGraph.Graph.Link l -> link_to_yojson l
    | StartLink l -> start_link_to_yojson l
  type node = [%import: EasyGraph.Graph.node] [@@deriving yojson]
  type t = [%import: EasyGraph.Graph.t] [@@deriving yojson]
end

module X = struct
  type e = [%import: EasyGraph.Xstate.e] [@@deriving to_yojson]
  type s = [%import: EasyGraph.Xstate.s] [@@deriving to_yojson]
  let on_to_yojson l =
    `Assoc (l |> List.map (fun (k, v) -> k, `String v))
  type state = EasyGraph.Xstate.state = {
    typ: string option [@key "type"] [@default None]; (* final? *)
    on: (e * s) list [@of_yojson on_of_yojson] [@to_yojson on_to_yojson];
  } [@@deriving to_yojson]
  let states_to_yojson a =
    `Assoc (a |> Array.to_list |> List.map (fun (k, v) -> k, state_to_yojson v))
  type t = EasyGraph.Xstate.t = {
    id: string;
    initial: s;
    context: unit [@to_yojson (fun () -> `Assoc [])];
    states: (s * state) array [@to_yojson states_to_yojson];
  } [@@deriving to_yojson]
end


let () =
  match Yojson.Safe.from_channel stdin |> G.of_yojson with
  | Error e ->
    prerr_endline ("invalid " ^ e)
  | Ok g ->
    EasyGraph.Xstate.of_graph ~id:"machine" ~named:true g |>
    X.to_yojson |>
    Yojson.Safe.pretty_to_channel stdout
