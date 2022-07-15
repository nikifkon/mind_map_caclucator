import { useState, useEffect } from 'react';
import './App.css';
import 'katex/dist/katex.min.css';

import InputMatrix from './view/InputMatrix'
import DisplayMatrix from './view/DisplayMatrix'
import MainTable from './view/MainTable'


function App() {
  const [concepts, setConcepts] = useState([
    "Низкие размеры движения",
    "Функциональное управление",
    "Результаты",
    "Производительность и эффективность",
    "Персонал",
    "Технические ресурсы",
    "Нормативная база",
    "МИЛ",
  ])
  const [data, setData] = useState([
    [0, 0, -1, -1, 0.5, -0.4, 0, 0],
    [-.7, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 2-1, 0, .9, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, .7, 0, .7, 0, .9, 0, 1],
    [0, 1, 0, 0, 0, 0, 0, .9],
    [0, 0, 0, 0, .7, 0, 0, 1],
    [0, 0, 2-1, 2-1, 0, 0, 0, 0]
  ]);

  function setIJ(i, j, value) {
      let new_data = [...data];
      new_data[i][j] = value.replace(",",".");
      setData(new_data)
  }
  return (
    <div id="main">
      <h3>Управление концептами</h3>
      <ul>
          {concepts.map((el, index) =>
          <li key={index}>
              <label>{el}</label>
              <a style={{    textDecoration: "none",
    color: "red"
  }}href="" onClick={event => {
                event.preventDefault();
                let new_concepts = [...concepts.slice(0, index), ...concepts.slice(index+1)];
                setConcepts(new_concepts);
                let n = concepts.length;
                setData([...Array(n-1)].map(e => Array(n-1).fill(0)))
              }}> удалить</a>
          </li>
          )}
      </ul>
       <input type="text" id="new_concept"/> 
      <button onClick={event => {
        event.preventDefault();
        let concept = document.querySelector("#new_concept").value;
        let n = concepts.length;
        setData([...Array(n+1)].map(e => Array(n+1).fill(0)))
        setConcepts([...concepts, concept]);
        document.querySelector("#new_concept").value = "";
      }}>добавить концепт</button>
      <InputMatrix
        data={data}
        concepts={concepts}
        setIJ={setIJ}
      />
      <h2>Определение когнитивной матрицы взаимодействия</h2>
      <MainTable
        data={data}
        concept_list={concepts}
        setConcepts={setConcepts} // todo
      />
    </div>
  );
}

export default App;
