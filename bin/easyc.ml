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
  type s = [%import: EasyGraph.Xstate.s] [@@deriving to_yojson]
  let on_to_yojson f l =
    `Assoc (l |> List.map (fun (k, v) ->
      let k =
        match f k with
        | `String s -> s
        | _ -> failwith "bad f in on_to_yojson" (* FIXME fix types? *)
      in
      k, `String v))
  type 'e state = 'e EasyGraph.Xstate.state = {
    typ: string option [@key "type"] [@default None]; (* final? *)
    on: ('e * s) list [@to_yojson on_to_yojson poly_e];
  } [@@deriving to_yojson]
  let states_to_yojson f a =
    `Assoc (a |> Array.to_list |> List.map (fun (k, v) -> k, state_to_yojson f v))
  type 'e t = 'e EasyGraph.Xstate.t = {
    id: string;
    initial: s;
    context: unit [@to_yojson (fun () -> `Assoc [])];
    states: (s * 'e state) array [@to_yojson states_to_yojson poly_e];
  } [@@deriving to_yojson]
end


type fmt =
  | XState
  | JS
  | JS_if
  | JS_fun

let compile id number inp out =
  let ch =
    match inp with
    | None -> stdin
    | Some fn -> open_in fn
  in
  match Yojson.Safe.from_channel ch |> G.of_yojson with
  | Error e ->
    prerr_endline ("invalid " ^ e)
  | Ok g ->
    let parse_edge = EasyGraph.Event.of_string in
    let x = EasyGraph.Xstate.of_graph ~id ~named:(not number) ~parse_edge g in
    match out with
    | XState ->
      X.to_yojson (fun x -> `String (EasyGraph.Event.to_string x)) x |>
      Yojson.Safe.pretty_to_channel stdout
    | JS -> EasyGraph.Js.gen `Imperative x
    | JS_if -> EasyGraph.Js.(gen `Imperative ~cases:gen_if) x
    | JS_fun -> EasyGraph.Js.gen `Functional x

open Cmdliner

let number =
  let doc = "number states instead of using their names" in
  Arg.(value & flag & info ~doc ["n"; "number"])

let id =
  let doc = "id" in
  Arg.(value & opt string "machine" & info ~doc ["id"])

let input =
  Arg.(value & pos 0 (some file) None & info ~docv:"INPUT" [])

let format =
  let doc = "format" in
  let t = Arg.enum [
    "xstate", XState;
    "js", JS;
    "js_if", JS_if;
    "functional_js", JS_fun;
  ] in
  Arg.(value & opt t XState & info ~doc ["f"; "format"])

let () =
  let open Term in
  let t =
    const compile $ id $ number $ input $ format,
    info "easy" ~doc:"an easyGraph compiler"
  in
  exit @@ eval t
