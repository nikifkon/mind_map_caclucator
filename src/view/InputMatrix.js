import { useState } from 'react';
import './InputMatrix.css'

function InputMatrix({data, setIJ, concepts}) {
    // todo warning if not a number
    let [selected, setSelected] = useState();

    function onTestClick(event) {
        event.preventDefault();
        console.log(event)
        document.querySelector('#main-form').reportValidity();
    }
    let current1 = "<не выбрано>";
    let current2 = "<не выбрано>";

    if (selected != undefined) {
        current1 = `${concepts[selected[0]]}`;
        current2 = `${concepts[selected[1]]}`;
    }
    
    return (
        <form id="main-form">
            <h3>Матрица когнитивной карты</h3>
            <table className="table table-header-rotated">
                <thead>
                    <tr>
                        <th style={{textOrientation: "sideways"}}>Концепты</th>
                        {
                            concepts.map((concept, index) => {
                                return <th key={index} className="rotate"><div><span>{concept}</span></div></th>
                            })
                        }
                    </tr>
                </thead>
                <tbody>
                    {
                        data.map((row, index) => {
                            return (
                                <tr key={index}>
                                    <td>{concepts[index]}</td>
                                    {row.map((scalar, jndex) => {
                                        return <td key={jndex}>
                                            <input onSelect={event => {
                                            setSelected([index, jndex])
                                            }} required type="number" max="1" min="-1" step="0.01" style={{
                                                backgroundColor: `rgba(${Math.round((1-scalar)*255/2)}, ${Math.round((1+parseFloat(scalar))*255/2)}, ${Math.round(Math.min((1-scalar)*255/2, (1+parseFloat(scalar))*255/2))})`,
                                                color: `${scalar < 0 ? "#fff" : "#000"}`
                                            }}
                                            value={scalar} onChange={e => setIJ(index, jndex, e.target.value)}/>
                                        </td>
                                    })}
                                </tr>
                            )
                        })
                    }
                </tbody>
            </table>
                <h3>{current1} → {current2}</h3>
        <button onClick={onTestClick}>Проверить корректность</button>
        </form>
    );
}

export default InputMatrix;